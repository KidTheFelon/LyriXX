use std::collections::HashMap;
use std::sync::Arc;

use crate::rhyme::RhymeWord;

pub type CmuDict = Arc<CmuDictInner>;

pub struct CmuDictInner {
    word_to_phonemes: HashMap<String, Vec<String>>,
    rhyme_index: HashMap<String, Vec<RhymeEntry>>,
    pos_dict: HashMap<String, Vec<String>>,
}

#[allow(dead_code)]
struct RhymeEntry {
    word: String,
    syllables: u32,
    phoneme_count: usize,
}

fn is_vowel(phoneme: &str) -> bool {
    let base = phoneme.trim_end_matches(|c: char| c.is_ascii_digit());
    matches!(
        base,
        "AA" | "AE" | "AH" | "AO" | "AW" | "AY" | "EH" | "ER" | "EY"
            | "IH" | "IY" | "OW" | "OY" | "UH" | "UW"
    )
}

fn has_stress(phoneme: &str) -> bool {
    phoneme.ends_with('1') || phoneme.ends_with('2')
}

fn count_syllables(phonemes: &[String]) -> u32 {
    phonemes.iter().filter(|p| is_vowel(p)).count() as u32
}

fn rhyme_key(phonemes: &[String]) -> Option<String> {
    let mut last_stressed = None;
    let mut last_vowel = None;
    for (i, p) in phonemes.iter().enumerate() {
        if is_vowel(p) {
            last_vowel = Some(i);
            if has_stress(p) {
                last_stressed = Some(i);
            }
        }
    }
    let start = last_stressed.or(last_vowel)?;
    Some(phonemes[start..].join(" "))
}

fn moby_code_to_russian(code: char) -> &'static str {
    match code {
        'N' | 'p' | 'h' => "с",
        'V' | 't' | 'i' => "г",
        'A' => "п",
        'v' => "н",
        'r' | 'o' => "мс",
        '!' => "межд",
        'C' => "союз",
        'P' => "предл",
        'D' | 'I' => "артикль",
        _ => "",
    }
}

fn guess_pos_all(pos_dict: &HashMap<String, Vec<String>>, word: &str) -> Vec<String> {
    let w = word.to_lowercase();

    if let Some(pos_list) = pos_dict.get(&w) {
        return pos_list.clone();
    }

    let mut result = Vec::new();

    if w.ends_with("tion") || w.ends_with("sion") || w.ends_with("ment")
        || w.ends_with("ness") || w.ends_with("ity") || w.ends_with("ence")
        || w.ends_with("ance") || w.ends_with("ism") || w.ends_with("ist")
        || w.ends_with("ure") || w.ends_with("dom") || w.ends_with("ship")
        || w.ends_with("hood") || w.ends_with("age") || w.ends_with("ee")
        || w.ends_with("eer") || w.ends_with("ess") || w.ends_with("ling")
        || w.ends_with("ary") || w.ends_with("ery") || w.ends_with("ory")
        || w.ends_with("ant") || w.ends_with("ent")
    {
        result.push("с".into());
    }

    if w.ends_with("ize") || w.ends_with("ise") || w.ends_with("ify")
        || w.ends_with("ate") || w.ends_with("fy") || w.ends_with("esce")
    {
        result.push("г".into());
    }

    if w.ends_with("ous") || w.ends_with("ive") || w.ends_with("ful")
        || w.ends_with("less") || w.ends_with("able") || w.ends_with("ible")
        || w.ends_with("al") || w.ends_with("ial") || w.ends_with("ic")
        || w.ends_with("ical") || w.ends_with("ile") || w.ends_with("ine")
        || w.ends_with("esque") || w.ends_with("like")
    {
        result.push("п".into());
    }

    if w.ends_with("ly") && w.len() > 3 {
        result.push("н".into());
    }

    result
}

pub fn load_cmu_dict(
    cmu_bytes: &'static [u8],
    pos_bytes: &'static [u8],
) -> CmuDictInner {
    let start = std::time::Instant::now();

    let mut word_to_phonemes: HashMap<String, Vec<String>> = HashMap::new();
    for line in std::str::from_utf8(cmu_bytes).unwrap_or("").lines() {
        if line.starts_with(";;;") || line.trim().is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split("  ").collect();
        if parts.len() < 2 {
            continue;
        }
        let raw_word = parts[0].trim();
        let word = raw_word
            .to_lowercase()
            .split('(')
            .next()
            .unwrap_or("")
            .to_string();
        if word.is_empty() || !word.is_ascii() {
            continue;
        }
        let phonemes: Vec<String> = parts[1]
            .split_whitespace()
            .map(|p| p.to_string())
            .collect();
        if phonemes.is_empty() {
            continue;
        }
        word_to_phonemes.insert(word, phonemes);
    }

    tracing::info!(
        words = word_to_phonemes.len(),
        elapsed_ms = start.elapsed().as_millis() as u64,
        "CMU dict loaded"
    );

    let mut pos_dict: HashMap<String, Vec<String>> = HashMap::with_capacity(200_000);
    for line in std::str::from_utf8(pos_bytes).unwrap_or("").lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if let Some(pos_start) = line.rfind('\\') {
            let word = line[..pos_start].to_lowercase();
            let codes = &line[pos_start + 1..];
            let pos_list: Vec<String> = codes
                .chars()
                .map(|c| moby_code_to_russian(c).to_string())
                .collect();
            if !pos_list.is_empty() {
                pos_dict.insert(word, pos_list);
            }
        }
    }

    tracing::info!(
        entries = pos_dict.len(),
        elapsed_ms = start.elapsed().as_millis() as u64,
        "Moby POS dict loaded"
    );

    let mut rhyme_index: HashMap<String, Vec<RhymeEntry>> = HashMap::new();
    for (word, phonemes) in &word_to_phonemes {
        if let Some(key) = rhyme_key(phonemes) {
            rhyme_index
                .entry(key)
                .or_default()
                .push(RhymeEntry {
                    word: word.clone(),
                    syllables: count_syllables(phonemes),
                    phoneme_count: phonemes.len(),
                });
        }
    }

    tracing::info!(keys = rhyme_index.len(), "CMU rhyme index built");

    CmuDictInner { word_to_phonemes, rhyme_index, pos_dict }
}

pub fn find_english_rhymes(dict: &CmuDictInner, word: &str, max_results: u32) -> Vec<RhymeWord> {
    let input = word.to_lowercase();

    let phonemes = match dict.word_to_phonemes.get(&input) {
        Some(p) => p,
        None => return vec![],
    };

    let key = match rhyme_key(phonemes) {
        Some(k) => k,
        None => return vec![],
    };

    let input_phoneme_count = phonemes.len();

    let candidates = match dict.rhyme_index.get(&key) {
        Some(c) => c,
        None => return vec![],
    };

    let mut results: Vec<RhymeWord> = candidates
        .iter()
        .filter(|c| c.word != input)
        .map(|c| {
            let phoneme_diff = (input_phoneme_count as i32 - c.phoneme_count as i32).unsigned_abs();
            let base_score = 1.0 / (1.0 + phoneme_diff as f32 * 0.1);
            RhymeWord {
                word: c.word.clone(),
                score: 1.0 - base_score,
                syllables: None,
                part_of_speech: guess_pos_all(&dict.pos_dict, &c.word),
            }
        })
        .collect();

    results.sort_by(|a, b| a.score.partial_cmp(&b.score).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(max_results as usize);
    results
}

#[allow(dead_code)]
pub fn cmu_syllables(dict: &CmuDictInner, word: &str) -> Option<u32> {
    dict.word_to_phonemes
        .get(&word.to_lowercase())
        .map(|p| count_syllables(p))
}

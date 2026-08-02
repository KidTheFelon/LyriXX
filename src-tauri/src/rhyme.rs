use quickpoeter::api::string2word;
use quickpoeter::finder::{FindingInfo, WordCollector};
use quickpoeter::reader::GeneralSettings;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};

use crate::english_rhyme::CmuDict;
use crate::lang_detect::detect_language;

/// Макс. количество рифм в ответе.
const MAX_RHYME_RESULTS: u32 = 50;
/// Макс. размер LRU-кеша.
const MAX_CACHE_SIZE: usize = 256;

/// Потокобезопасный указатель на движок рифм.
pub type SharedRhymeEngine = Arc<Mutex<Option<RhymeEngine>>>;

/// Движок рифм: Zaliznyak + CMU dict + LRU-кеш.
pub struct RhymeEngine {
    inner: Mutex<(WordCollector, GeneralSettings)>,
    cmu: CmuDict,
    cache: Mutex<RhymeCache>,
}

struct RhymeCache {
    map: HashMap<String, Vec<RhymeWord>>,
    order: VecDeque<String>,
}

impl RhymeCache {
    fn new() -> Self {
        Self {
            map: HashMap::with_capacity(MAX_CACHE_SIZE),
            order: VecDeque::with_capacity(MAX_CACHE_SIZE),
        }
    }

    fn get(&mut self, key: &str) -> Option<Vec<RhymeWord>> {
        self.map.get(key).map(|v| {
            if let Some(pos) = self.order.iter().position(|k| k == key) {
                self.order.remove(pos);
                self.order.push_back(key.to_owned());
            }
            v.clone()
        })
    }

    fn insert(&mut self, key: String, value: Vec<RhymeWord>) {
        if self.map.len() >= MAX_CACHE_SIZE {
            if let Some(oldest) = self.order.pop_front() {
                self.map.remove(&oldest);
            }
        }
        self.map.insert(key.clone(), value);
        self.order.push_back(key);
    }
}

// SAFETY: RhymeEngine fields are all thread-safe:
// - inner: Mutex<(WordCollector, GeneralSettings)> — guarded by Mutex
// - cmu: CmuDict (Arc<CmuDictInner>) — Send+Sync
// - cache: Mutex<RhymeCache> — guarded by Mutex
// WordCollector contains UnsafeStrSaver (raw *const u8) but the referenced dictionary
// data is loaded once at init and lives for the program's entire lifetime.
// All mutable access goes through Mutex locks.
unsafe impl Send for RhymeEngine {}
unsafe impl Sync for RhymeEngine {}

impl RhymeEngine {
    pub fn init() -> Self {
        tracing::info!("Loading rhyme dictionary (Zaliznyak + CMU)...");
        let start = std::time::Instant::now();
        let wc = WordCollector::default();
        let gs = GeneralSettings::default();
        let cmu = Arc::new(crate::english_rhyme::load_cmu_dict(
            include_bytes!("../res/cmudict-0.7b.utf8"),
            include_bytes!("../res/mobypos.txt"),
        ));
        tracing::info!(elapsed_ms = start.elapsed().as_millis() as u64, "Rhyme dictionary loaded");
        Self {
            inner: Mutex::new((wc, gs)),
            cmu,
            cache: Mutex::new(RhymeCache::new()),
        }
    }
}

/// Результат рифмы.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RhymeWord {
    /// Слово-рифма.
    pub word: String,
    /// Оценка качества (0–1).
    pub score: f32,
    /// Слоги (опционально).
    pub syllables: Option<String>,
    /// Части речи.
    pub part_of_speech: Vec<String>,
}

/// Ответ API рифмовки.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RhymeResponse {
    /// Список рифм.
    pub rhymes: Vec<RhymeWord>,
    /// Количество слогов в исходном слове.
    pub input_syllables: Option<i32>,
}

#[tauri::command]
/// Tauri command: ищет рифмы для слова, автоопределяет язык.
pub async fn get_rhymes(
    word: String,
    _lang: String,
    depth: Option<u32>,
    engine: tauri::State<'_, SharedRhymeEngine>,
) -> Result<RhymeResponse, String> {
    let lang = if _lang == "auto" || _lang.is_empty() {
        detect_language(&word).to_string()
    } else {
        _lang.clone()
    };

    let max_results = match depth.unwrap_or(2) {
        1 => 15,
        2 => MAX_RHYME_RESULTS,
        _ => MAX_RHYME_RESULTS * 2,
    };

    tracing::info!(word = %word, lang = %lang, depth = depth.unwrap_or(2), "rhyme request");

    if word.chars().count() < 2 {
        return Ok(RhymeResponse { rhymes: vec![], input_syllables: None });
    }

    let input = word.to_lowercase();

    let cached = {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(RhymeResponse { rhymes: vec![], input_syllables: None });
        };
        let cache_key = format!("{}:{}", lang, input);
        let mut cache = rhyme_engine.cache.lock().map_err(|e| format!("Cache mutex poisoned: {}", e))?;
        cache.get(&cache_key)
    };

    if let Some(cached) = cached {
        tracing::info!(word = %input, lang = %lang, count = cached.len(), "rhymes from cache");
        return Ok(RhymeResponse { rhymes: cached, input_syllables: None });
    }

    let results = if lang == "en" {
        let cmu = {
            let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
            guard.as_ref().unwrap().cmu.clone()
        };
        crate::english_rhyme::find_english_rhymes(&cmu, &input, max_results)
    } else {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(RhymeResponse { rhymes: vec![], input_syllables: None });
        };
        let inner_guard = rhyme_engine.inner.lock().map_err(|e| format!("RhymeEngine inner mutex poisoned: {}", e))?;
        let (wc, gs) = &*inner_guard;

        let w = match string2word(wc, &input) {
            Ok(w) => w,
            Err(e) => {
                tracing::warn!(word = %input, error = %e, "word not found in dictionary");
                return Err(e);
            }
        };

        let info = FindingInfo::new(wc, &w, gs, None);
        wc.find_best(&info, vec![], max_results)
            .map_err(|e| {
                tracing::warn!(word = %input, error = %e, "find_best failed");
                e.to_string()
            })?
            .into_iter()
            .filter(|r| r.word.src.to_lowercase() != input)
            .map(|r| RhymeWord {
                word: r.word.src.clone(),
                score: *r.dist,
                syllables: None,
                part_of_speech: wc.get_speech_part(&r.word.src)
                    .map(|s| vec![s.to_owned()])
                    .unwrap_or_default(),
            })
            .collect::<Vec<RhymeWord>>()
    };

    tracing::debug!(word = %input, lang = %lang, count = results.len(), "rhyme results computed");

    {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(RhymeResponse { rhymes: vec![], input_syllables: None });
        };
        let cache_key = format!("{}:{}", lang, input);
        let mut cache = rhyme_engine.cache.lock().map_err(|e| format!("Cache mutex poisoned: {}", e))?;
        cache.insert(cache_key, results.clone());
    }

    tracing::info!(word = %input, lang = %lang, count = results.len(), "rhymes found");
    Ok(RhymeResponse { rhymes: results, input_syllables: None })
}

use serde::Deserialize;

use crate::rhyme::RhymeWord;

const RHYMEBRAIN_URL: &str = "https://rhymebrain.com/talk";

#[derive(Debug, Deserialize)]
struct RhymeBrainWord {
    word: String,
    #[serde(default)]
    score: f32,
    #[serde(default)]
    syllables: String,
    #[serde(default)]
    freq: u32,
}

pub async fn fetch_rhymes(
    client: &reqwest::Client,
    word: &str,
    max_results: u32,
) -> Vec<RhymeWord> {
    tracing::debug!(word, max_results, "english_rhyme: fetching from RhymeBrain");
    let resp = match client
        .get(RHYMEBRAIN_URL)
        .query(&[("function", "getRhymes"), ("word", word)])
        .query(&[("maxResults", &max_results.to_string())])
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            tracing::warn!(error = %e, word, "english_rhyme: request failed, returning empty");
            return vec![];
        }
    };

    if !resp.status().is_success() {
        let status = resp.status();
        tracing::warn!(%status, word, "english_rhyme: HTTP error, returning empty");
        return vec![];
    }

    let text = match resp.text().await {
        Ok(t) => t,
        Err(e) => {
            tracing::warn!(error = %e, word, "english_rhyme: failed to read response body");
            return vec![];
        }
    };

    let raw: Vec<RhymeBrainWord> = match serde_json::from_str(&text) {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!(error = %e, word, body_len = text.len(), "english_rhyme: failed to parse JSON");
            return vec![];
        }
    };

    let results: Vec<RhymeWord> = raw
        .into_iter()
        .filter(|r| r.word.to_lowercase() != word.to_lowercase())
        .map(|r| {
            let score = (300.0 - r.score).max(0.0) / 30.0;
            let syllables = if r.syllables.is_empty() { None } else { Some(r.syllables) };
            RhymeWord { word: r.word, score, syllables }
        })
        .collect();

    tracing::debug!(word, count = results.len(), "english_rhyme: results fetched");
    results
}

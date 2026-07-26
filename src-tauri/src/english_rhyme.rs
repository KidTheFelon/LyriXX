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
) -> Result<Vec<RhymeWord>, String> {
    tracing::debug!(word, max_results, "english_rhyme: fetching from RhymeBrain");
    let resp = client
        .get(RHYMEBRAIN_URL)
        .query(&[("function", "getRhymes"), ("word", word)])
        .query(&[("maxResults", &max_results.to_string())])
        .send()
        .await
        .map_err(|e| {
            tracing::warn!(error = %e, word, "english_rhyme: request failed");
            format!("RhymeBrain request failed: {}", e)
        })?;

    if !resp.status().is_success() {
        let status = resp.status();
        tracing::warn!(%status, word, "english_rhyme: HTTP error");
        return Err(format!("RhymeBrain HTTP {}", status));
    }

    let text = resp.text().await.map_err(|e| {
        tracing::warn!(error = %e, word, "english_rhyme: failed to read response body");
        format!("RhymeBrain read error: {}", e)
    })?;

    let raw: Vec<RhymeBrainWord> = serde_json::from_str(&text).map_err(|e| {
        tracing::warn!(error = %e, word, body_len = text.len(), "english_rhyme: failed to parse JSON");
        format!("RhymeBrain parse error: {} — body: {}", e, &text[..text.len().min(200)])
    })?;

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
    Ok(results)
}

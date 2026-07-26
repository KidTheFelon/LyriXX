use quickpoeter::api::string2word;
use quickpoeter::finder::{FindingInfo, WordCollector};
use quickpoeter::reader::GeneralSettings;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};

use crate::lang_detect::detect_language;

const MAX_RHYME_RESULTS: u32 = 50;
const MAX_CACHE_SIZE: usize = 256;

pub type SharedRhymeEngine = Arc<Mutex<Option<RhymeEngine>>>;

pub struct RhymeEngine {
    inner: Mutex<(WordCollector, GeneralSettings)>,
    http: reqwest::Client,
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
// - http: reqwest::Client is Send+Sync
// - cache: Mutex<RhymeCache> — guarded by Mutex
// WordCollector contains UnsafeStrSaver (raw *const u8) but the referenced dictionary
// data is loaded once at init and lives for the program's entire lifetime.
// All mutable access goes through Mutex locks.
unsafe impl Send for RhymeEngine {}
unsafe impl Sync for RhymeEngine {}

impl RhymeEngine {
    pub fn init() -> Self {
        tracing::info!("Loading rhyme dictionary (Zaliznyak + RhymeBrain)...");
        let start = std::time::Instant::now();
        let wc = WordCollector::default();
        let gs = GeneralSettings::default();
        let http = reqwest::Client::builder()
            .user_agent("LyriXX/0.2")
            .timeout(std::time::Duration::from_secs(3))
            .build()
            .expect("Failed to create HTTP client");
        tracing::info!(elapsed_ms = start.elapsed().as_millis() as u64, "Rhyme dictionary loaded");
        Self {
            inner: Mutex::new((wc, gs)),
            http,
            cache: Mutex::new(RhymeCache::new()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RhymeWord {
    pub word: String,
    pub score: f32,
    pub syllables: Option<String>,
}

#[tauri::command]
pub async fn get_rhymes(
    word: String,
    _lang: String,
    depth: Option<u32>,
    engine: tauri::State<'_, SharedRhymeEngine>,
) -> Result<Vec<RhymeWord>, String> {
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
        return Ok(vec![]);
    }

    let input = word.to_lowercase();

    let cached = {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(vec![]);
        };
        let cache_key = format!("{}:{}", lang, input);
        let mut cache = rhyme_engine.cache.lock().map_err(|e| format!("Cache mutex poisoned: {}", e))?;
        cache.get(&cache_key)
    };

    if let Some(cached) = cached {
        tracing::info!(word = %input, lang = %lang, count = cached.len(), "rhymes from cache");
        return Ok(cached);
    }

    let results = if lang == "en" {
        let client = {
            let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
            guard.as_ref().unwrap().http.clone()
        };
        crate::english_rhyme::fetch_rhymes(&client, &input, max_results).await
    } else {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(vec![]);
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
            .map(|r| RhymeWord {
                word: r.word.src.clone(),
                score: *r.dist,
                syllables: None,
            })
            .collect::<Vec<RhymeWord>>()
    };

    tracing::debug!(word = %input, lang = %lang, count = results.len(), "rhyme results computed");

    {
        let guard = engine.lock().map_err(|e| format!("RhymeEngine mutex poisoned: {}", e))?;
        let Some(rhyme_engine) = guard.as_ref() else {
            return Ok(vec![]);
        };
        let cache_key = format!("{}:{}", lang, input);
        let mut cache = rhyme_engine.cache.lock().map_err(|e| format!("Cache mutex poisoned: {}", e))?;
        cache.insert(cache_key, results.clone());
    }

    tracing::info!(word = %input, lang = %lang, count = results.len(), "rhymes found");
    Ok(results)
}

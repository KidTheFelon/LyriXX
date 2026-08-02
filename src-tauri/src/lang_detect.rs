/// Определяет язык слова: "ru" или "en" по подсчёту кириллических/латинских символов.
pub fn detect_language(word: &str) -> &'static str {
    let mut cyrillic = 0u32;
    let mut latin = 0u32;
    for c in word.chars() {
        match c {
            '\u{0400}'..='\u{04FF}' | '\u{0500}'..='\u{052F}' => cyrillic += 1,
            'a'..='z' | 'A'..='Z' => latin += 1,
            _ => {}
        }
    }
    let lang = if cyrillic > latin { "ru" } else { "en" };
    tracing::trace!(word = %word, lang, cyrillic, latin, "detect_language");
    lang
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_russian() {
        assert_eq!(detect_language("привет"), "ru");
        assert_eq!(detect_language("любовь"), "ru");
        assert_eq!(detect_language("дом"), "ru");
    }

    #[test]
    fn test_english() {
        assert_eq!(detect_language("hello"), "en");
        assert_eq!(detect_language("love"), "en");
        assert_eq!(detect_language("world"), "en");
    }

    #[test]
    fn test_mixed() {
        assert_eq!(detect_language("приветworld"), "ru");
        assert_eq!(detect_language("helloмир"), "en");
    }
}

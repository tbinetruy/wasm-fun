(setq wat-types
  '("i32"
    "f32"
    "i64"
    "f64"
    "anyfunc"))

(setq wat-keywords
      '("module" "import" "func" "data" "get_local" "call" "export" "param" "result" "table" "set_local" "br_if" "loop" "block" "if" "then" "else" "local" "global" "get_global" "set_global" "drop" "br"))

(defvar wat-tab-width nil "Width of a tab for WAT mode")

(defvar wat-font-lock-defaults
  `((
      ("\"\\.\\*\\?" . font-lock-string-face)
      ( ,(regexp-opt wat-keywords 'words) . font-lock-keyword-face)
      ( ,(regexp-opt wat-types 'words) . font-lock-type-face)
      ("\\$[a-zA-z0-1_]+" . font-lock-constant-face)
      )))

(define-derived-mode wat-mode lisp-mode "WAT script"
  "WAT mode is a major mode for editing WAT files"
  (setq font-lock-defaults wat-font-lock-defaults)

  (when wat-tab-width
    (setq tab-width wat-tab-width))

  (modify-syntax-entry ?# "< b" wat-mode-syntax-table)
  (modify-syntax-entry ?\n "> b" wat-mode-syntax-table)
  )

(provide 'wat-mode)

;; marketplace-utils.clar
;; Utility functions for the Bitcoin P2P Marketplace

;; Constants for fee calculations
(define-constant SATOSHIS-PER-BTC u100000000)  ;; 10^8 satoshis in 1 BTC
(define-constant BASIS-POINTS-DENOMINATOR u10000)  ;; 10000 basis points = 100%

(define-read-only (format-btc-amount (satoshis uint))
    ;; Ensure that the frontend handles formatting correctly.
    ;; Here, we return satoshis to be formatted on the frontend.
    satoshis
)

;; Utility functions for calculations
(define-read-only (calculate-stx-required 
    (price-per-btc uint) 
    (btc-amount uint))
    (/ (* price-per-btc btc-amount) SATOSHIS-PER-BTC)
)

(define-read-only (calculate-fee 
    (amount uint) 
    (fee-basis-points uint))
    (/ (* amount fee-basis-points) BASIS-POINTS-DENOMINATOR)
)

;; Fee calculation helper
(define-read-only (calculate-platform-fee 
    (stx-amount uint))
    (calculate-fee stx-amount (contract-call? .marketplace-core get-platform-fee))
)

;; Time utilities
(define-read-only (blocks-to-time 
    (blocks uint))
    ;; Assuming average Stacks block time of 10 minutes
    (* blocks u600)  ;; Returns approximate time in seconds
)

(define-read-only (is-listing-expired 
    (listing-id uint))
    (let
        ((listing (contract-call? .marketplace-core get-listing listing-id))
         (current-height (unwrap-panic (get-block-info? height u0))))
        
        (match listing
            l (> current-height (get expires-at l))
            true
        )
    )
)

;; Format utilities
(define-read-only (format-btc-amount 
    (satoshis uint))
    ;; This is a placeholder - Clarity doesn't support floating point
    ;; This would be handled in frontend
    satoshis
)

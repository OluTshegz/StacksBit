;; marketplace-client.clar
;; Client-facing convenience functions for the Bitcoin P2P Marketplace

;; Query functions for frontend use
(define-read-only (get-listing-with-details (listing-id uint))
    (let
        ((listing (contract-call? .marketplace-core get-listing listing-id))
         (escrow (contract-call? .marketplace-escrow get-escrow listing-id))
         (dispute (contract-call? .marketplace-disputes get-dispute listing-id))
         (current-height (unwrap-panic (get-block-info? height u0))))
        
        {
            listing: listing,
            escrow: escrow,
            dispute: dispute,
            is-expired: (match listing
                           l (> current-height (get expires-at l))
                           false),
            is-active: (match listing
                          l (get active l)
                          false)
        }
    )
)

;; Get multiple listings at once (for pagination)
(define-read-only (get-listings-batch (start-id uint) (count uint))
    (let
        ((end-id (+ start-id count))
         (listing-count (contract-call? .marketplace-core get-listing-count)))
        
        (filter is-listing-valid 
            (map get-listing-wrapper 
                (get-id-range start-id (min end-id listing-count))))
    )
)

;; Helper function to generate a range of IDs
(define-private (get-id-range (start uint) (end uint))
    (list start)  ;; This is a simplified placeholder
                 ;; In reality, you'd need a proper list generation
                 ;; which Clarity doesn't directly support
)

;; Wrapper for get-listing to use with map
(define-private (get-listing-wrapper (id uint))
    (contract-call? .marketplace-core get-listing id)
)

;; Filter function for valid listings
(define-private (is-listing-valid (listing (optional {
        seller: principal,
        price-per-btc: uint,
        btc-amount: uint,
        stx-required: uint,
        btc-address: (string-ascii 34),
        active: bool,
        created-at: uint,
        expires-at: uint
    })))
    (is-some listing)
)

;; Get seller's active listings
(define-read-only (get-seller-listings (seller principal))
    ;; Note: This is a simplified implementation
    ;; In a real contract, you would need to implement a more sophisticated
    ;; way to track listings by seller, possibly using a separate map
    {
        seller: seller,
        listings: (list u0)  ;; Placeholder
    }
)

;; Get buyer's active purchases
(define-read-only (get-buyer-purchases (buyer principal))
    ;; Note: As above, this is simplified
    {
        buyer: buyer,
        purchases: (list u0)  ;; Placeholder
    }
)

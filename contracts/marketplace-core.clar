;; marketplace-core.clar
;; Core functionality for the Bitcoin P2P Marketplace

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-INVALID-LISTING (err u2))
(define-constant ERR-LISTING-CLOSED (err u3))
(define-constant ERR-INSUFFICIENT-FUNDS (err u4))
(define-constant ERR-NO-SUCH-LISTING (err u5))

;; Data variables
(define-data-var listing-count uint u0)
(define-data-var platform-fee-percent uint u100) ;; 1% in basis points
(define-data-var platform-wallet principal tx-sender)

(define-event event-listing-created (listing-id uint))
(define-event event-listing-updated (listing-id uint))
(define-event event-listing-closed (listing-id uint))

(define-public (create-listing 
    (title (string-ascii 100))
    (price-btc uint))
    (let ((listing-id (get-next-id))) ;; Assuming there's a way to get unique IDs
        (map-set listings listing-id {
            title: title,
            price-btc: price-btc,
            seller: tx-sender,
            status: "active"
        })
        (emit-event event-listing-created listing-id)
        (ok listing-id)
    )
)

(define-public (close-listing (listing-id uint))
    (let ((listing (unwrap! (map-get? listings listing-id) (err u1))))
        (map-set listings listing-id {listing | status: "closed"})
        (emit-event event-listing-closed listing-id)
        (ok true)
    )
)

;; Define the listing data structure
(define-map listings uint {
    seller: principal,
    price-per-btc: uint,  ;; Price in STX for 1 BTC (in satoshis)
    btc-amount: uint,     ;; Amount of BTC offered (in satoshis)
    stx-required: uint,   ;; Total STX required for purchase
    btc-address: (string-ascii 34),  ;; Seller's BTC address
    active: bool,
    created-at: uint,
    expires-at: uint
})

;; Read-only functions for listings
(define-read-only (get-listing (listing-id uint))
    (map-get? listings listing-id)
)

;; Create a new listing
(define-public (create-listing 
    (price-per-btc uint) 
    (btc-amount uint) 
    (btc-address (string-ascii 34))
    (expires-in uint))
    (let
        ((new-id (+ (var-get listing-count) u1))
         (block-height (unwrap-panic (get-block-info? height u0)))
         (expires-at (+ block-height expires-in))
         (stx-required (/ (* price-per-btc btc-amount) u100000000)))
        
        (map-set listings new-id {
            seller: tx-sender,
            price-per-btc: price-per-btc,
            btc-amount: btc-amount,
            stx-required: stx-required,
            btc-address: btc-address,
            active: true,
            created-at: block-height,
            expires-at: expires-at
        })
        
        (var-set listing-count new-id)
        (ok new-id)
    )
)

;; Cancel listing (by seller, if no active escrow)
(define-public (cancel-listing
    (listing-id uint))
    (let
        ((listing (unwrap! (map-get? listings listing-id) ERR-NO-SUCH-LISTING)))
        
        ;; Only seller can cancel
        (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-AUTHORIZED)
        
        ;; Check if there's an active escrow
        (match (contract-call? .marketplace-escrow get-escrow listing-id)
            escrow (asserts! false (err u9)) ;; ERR-ESCROW-ACTIVE
            true
        )
        
        ;; Mark listing as inactive
        (map-set listings listing-id (merge listing { active: false }))
        
        (ok true)
    )
)

;; Administrative functions
(define-public (set-platform-fee (new-fee uint))
    (begin
        (asserts! (is-eq tx-sender (var-get platform-wallet)) ERR-NOT-AUTHORIZED)
        (var-set platform-fee-percent new-fee)
        (ok true)
    )
)

(define-public (set-platform-wallet (new-wallet principal))
    (begin
        (asserts! (is-eq tx-sender (var-get platform-wallet)) ERR-NOT-AUTHORIZED)
        (var-set platform-wallet new-wallet)
        (ok true)
    )
)

;; Getter functions for contract info
(define-read-only (get-platform-fee)
    (var-get platform-fee-percent)
)

(define-read-only (get-platform-wallet)
    (var-get platform-wallet)
)

(define-read-only (get-listing-count)
    (var-get listing-count)
)

;; Function to query active listings
(define-read-only (is-listing-active (listing-id uint))
    (match (map-get? listings listing-id)
        listing (get active listing)
        false
    )
)

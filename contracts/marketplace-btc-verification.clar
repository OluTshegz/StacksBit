;; marketplace-btc-verification.clar
;; Handles Bitcoin transaction verification for the P2P Marketplace

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-NO-SUCH-LISTING (err u5))
(define-constant ERR-INVALID-PROOF (err u10))
(define-constant ERR-AMOUNT-MISMATCH (err u11))
(define-constant ERR-RECIPIENT-MISMATCH (err u12))
(define-constant ERR-BTC-TX-UNVERIFIED (err u8))

;; Log transaction verification events
(define-event event-tx-verified (tx-id (buff 32)))
(define-event event-tx-unverified (tx-id (buff 32)))

(define-public (is-tx-verified (tx-id (buff 32)))
  (let ((is-verified (check-tx-verification tx-id)))  ;; Assuming there's a check function
    (if is-verified
        (begin
          (emit-event event-tx-verified tx-id)
          (ok true))
        (begin
          (emit-event event-tx-unverified tx-id)
          (err ERR-BTC-TX-UNVERIFIED))))
)

;; BTC transaction verification
(define-map verified-btc-txs (buff 32) {
    verified: bool,
    amount: uint,
    recipient: (string-ascii 34),
    block-height: uint
})

;; Read-only function to verify BTC transaction
(define-read-only (verify-btc-tx (tx-id (buff 32)))
    (map-get? verified-btc-txs tx-id)
)

;; Check if a transaction is verified
(define-read-only (is-tx-verified (tx-id (buff 32)))
    (match (map-get? verified-btc-txs tx-id)
        tx-info (get verified tx-info)
        false
    )
)

;; Submit BTC transaction proof
(define-public (submit-btc-tx-proof 
    (listing-id uint)
    (tx-id (buff 32))
    (btc-tx-proof (buff 1024)))  ;; This would be the proof compatible with any BTC oracle
    (let
        ((escrow (unwrap! (contract-call? .marketplace-escrow get-escrow listing-id) ERR-NO-SUCH-LISTING))
         (block-height (unwrap-panic (get-block-info? height u0))))
        
        ;; Only the seller can submit tx proof
        (asserts! (is-eq tx-sender (get seller escrow)) ERR-NOT-AUTHORIZED)
        
        ;; Verify BTC transaction using external oracle
        ;; This is a simplified placeholder - actual implementation would use a BTC oracle like MAGIC
        (try! (verify-btc-proof tx-id btc-tx-proof (get btc-amount escrow) (get btc-receiver-address escrow)))
        
        ;; Mark transaction as verified
        (map-set verified-btc-txs tx-id {
            verified: true,
            amount: (get btc-amount escrow),
            recipient: (get btc-receiver-address escrow),
            block-height: block-height
        })
        
        ;; Update escrow with tx-id
        (try! (contract-call? .marketplace-escrow-helper update-escrow-tx-id listing-id tx-id))
        
        (ok true)
    )
)

;; Mock function to verify BTC proof (would be replaced with actual oracle integration)
(define-private (verify-btc-proof 
    (tx-id (buff 32)) 
    (proof (buff 1024))
    (expected-amount uint)
    (expected-recipient (string-ascii 34)))
    
    ;; This is a mock implementation
    ;; In production, this would integrate with a Bitcoin oracle to verify the transaction
    ;; For example, using the Stacks Bitcoin API or a service like MAGIC protocol
    
    ;; For testing purposes, we're assuming the proof validates
    ;; In production, add proper validation logic here
    (ok true)
)

;; Admin function to manually verify a BTC transaction (for testing or emergency)
(define-public (admin-verify-btc-tx
    (tx-id (buff 32))
    (amount uint)
    (recipient (string-ascii 34)))
    (let
        ((platform-wallet (contract-call? .marketplace-core get-platform-wallet))
         (block-height (unwrap-panic (get-block-info? height u0))))
        
        ;; Only platform wallet can perform manual verification
        (asserts! (is-eq tx-sender platform-wallet) ERR-NOT-AUTHORIZED)
        
        ;; Mark transaction as verified
        (map-set verified-btc-txs tx-id {
            verified: true,
            amount: amount,
            recipient: recipient,
            block-height: block-height
        })
        
        (ok true)
    )
)

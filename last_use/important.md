New failure scenorio
CHOOSE SHOP
-> SELECT SHOP
CREATE ORDER
→ AUTHORIZE PAYMENT
→ ASSIGN NEAREST SHOP (A)

IF ACCEPT:
→ CAPTURE → SUCCESS

IF REJECT:
→ FIND NEXT SHOP (B)
→ CALCULATE PRICE

→ ASK CUSTOMER:
IF ACCEPT:
→ CONTINUE → CAPTURE
IF REJECT:
→ VOID → CANCEL

IF ALL SHOPS FAIL:
→ VOID PAYMENT
→ SHOW SORRY MESSAGE



🚀 Small Improvement (Make it Perfect)

Use this final version:

[Logo]

ThanniGo
(Marketplace Platform – Facilitator)

--------------------------------
Seller:
ABC Water Supplier
GSTIN: XXXXX

--------------------------------
Customer:
Ugendran
Chennai

--------------------------------
Note:
"This invoice is issued by the seller. ThanniGo acts only as a facilitator."
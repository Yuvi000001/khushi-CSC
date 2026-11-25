# Asli images yahan rakhein

Is folder me jo bhi asli image rakhenge, site use **apne aap** dikha degi (code badalna nahi padega).
Format: png, webp, jpg ya svg. Naam bilkul neeche jaisa hona chahiye.

## frontend/images/yojana/  (sarkari yojana ke logo)
pmkisan · ayushman · eshram · digitalindia · pmay · csc · samagra · ration · pension · pan
Jaise: `yojana/pmkisan.png`, `yojana/ayushman.png`

Logo ko us yojana ki **aadhikarik website** se lein (jaise pmkisan.gov.in, pmjay.gov.in, eshram.gov.in,
digitalindia.gov.in, csc.gov.in). Website par logo ka use karne ke niyam wahin check kar lein.
Jis yojana ki image nahi hogi, uska simple icon dikhta rahega.

## frontend/images/services/  (har seva ki apni image, optional)
Naam = seva ka slug: samagra, ration, pension, pmkisan, ayushman, eshram, income, caste, domicile,
pan, aadhaar, money, bank, insurance, onlineform, printing, recharge, pdf, ticket

## frontend/images/banners/
- `hero.jpg`  -> home page par bade chitra ki jagah aapke kendra ki asli photo
- `shop.jpg`  -> About page par dukaan ki asli photo
(Photo 4:3 ho to sabse achhi dikhti hai.)

## frontend/images/about/
- `madhya-pradesh-emblem.jpeg` -> About page par Madhya Pradesh ka rajya-chihn
- `madhya-pradesh-map-transparent.png` -> About aur Home page par background-free Madhya Pradesh ka naksha

## frontend/images/logo/
Aapka apna logo (logo-1024/512/192.png, favicon-64.png). Logo badalna ho to naya circular logo inhi naamon se replace kar dein.

Band karna ho to js/config.js me `USE_REAL_IMAGES: false` kar dein.

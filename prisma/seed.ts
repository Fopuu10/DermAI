import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const conditions = [
  {
    name: "Acne Vulgaris",
    shortDescription: "Common pimples, blackheads, and whiteheads driven by oil and clogged pores.",
    longDescription:
      "Acne vulgaris occurs when hair follicles become clogged with oil and dead skin cells. It's most common during teenage years but can affect adults too. Bacteria (P. acnes) plays a role in inflammation.",
    tags: ["acne"],
    typicalSymptoms: ["pimples", "blackheads", "oily", "redness"],
    typicalLocations: ["face", "back", "chest"],
    chronic: false,
    causes: ["Excess sebum production", "Hormonal changes", "Bacteria (P. acnes)", "Clogged pores", "Stress"],
    riskFactors: ["Adolescence", "Family history", "Hormonal cycles", "High-glycemic diet", "Comedogenic products"],
    whenToSeeDoctor: ["Severe cystic acne", "Painful nodules", "Scarring", "Acne not responding to OTC products"],
    prevention: ["Wash twice daily with gentle cleanser", "Avoid picking", "Use non-comedogenic products", "Manage stress"],
    treatmentsGeneral: ["Salicylic acid 2%", "Benzoyl peroxide 2.5%", "Adapalene 0.1%", "Niacinamide serum"],
    effects: ["Scarring if picked", "Post-inflammatory pigmentation", "Self-esteem impact"],
  },
  {
    name: "Atopic Dermatitis (Eczema)",
    shortDescription: "Itchy, inflamed patches of skin, often dry and recurring.",
    longDescription:
      "Eczema is a chronic inflammatory skin condition. The skin barrier is impaired, leading to dryness, itching, and inflammation. Triggers include irritants, allergens, and stress.",
    tags: ["eczema"],
    typicalSymptoms: ["itching", "dryness", "redness", "patches", "flaking"],
    typicalLocations: ["arms", "legs", "neck", "hands"],
    chronic: true,
    causes: ["Genetics", "Skin barrier dysfunction", "Immune dysregulation"],
    riskFactors: ["Family history of allergies", "Asthma", "Hay fever"],
    whenToSeeDoctor: ["Severe itching disrupting sleep", "Signs of infection (oozing, fever)", "Widespread rash"],
    prevention: ["Daily moisturizer", "Avoid hot showers", "Identify and avoid triggers", "Use fragrance-free products"],
    treatmentsGeneral: ["Ceramide moisturizer", "Colloidal oatmeal baths", "1% hydrocortisone (short-term)", "Cool compresses"],
    effects: ["Sleep disruption", "Skin thickening (lichenification)", "Risk of infection"],
  },
  {
    name: "Seborrheic Dermatitis (Dandruff)",
    shortDescription: "Flaky, oily scalp or facial skin caused by yeast overgrowth.",
    longDescription:
      "Seborrheic dermatitis is caused by Malassezia yeast. It produces flaky, sometimes greasy scales on the scalp, eyebrows, and around the nose.",
    tags: ["dandruff", "scalp"],
    typicalSymptoms: ["flaking", "itching", "oily", "redness"],
    typicalLocations: ["scalp", "face", "chest"],
    chronic: true,
    causes: ["Malassezia yeast", "Excess sebum", "Cold weather"],
    riskFactors: ["Stress", "Oily skin", "Immune conditions"],
    whenToSeeDoctor: ["Severe scalp inflammation", "Hair loss", "No improvement after 2 weeks of OTC treatment"],
    prevention: ["Wash hair regularly", "Manage stress", "Avoid heavy hair products"],
    treatmentsGeneral: ["Ketoconazole 1% shampoo", "Zinc pyrithione shampoo", "Selenium sulfide", "Gentle scalp cleansing"],
    effects: ["Visible flakes", "Scalp itching", "Embarrassment"],
  },
  {
    name: "Hyperpigmentation",
    shortDescription: "Darkened patches from excess melanin — often post-acne or sun damage.",
    longDescription:
      "Hyperpigmentation occurs when patches of skin become darker than the surrounding area due to excess melanin. Common types include post-inflammatory hyperpigmentation (PIH) and melasma.",
    tags: ["pigmentation"],
    typicalSymptoms: ["discoloration", "patches"],
    typicalLocations: ["face", "neck", "arms"],
    chronic: false,
    causes: ["Sun exposure", "Post-inflammatory response", "Hormonal changes", "Genetics"],
    riskFactors: ["Darker skin tones", "Sun without SPF", "Picking at acne", "Pregnancy"],
    whenToSeeDoctor: ["Rapidly darkening lesion", "Asymmetric pigmented spot", "Bleeding pigmented mole"],
    prevention: ["Daily SPF 50", "Don't pick", "Treat acne early", "Wear hats"],
    treatmentsGeneral: ["Vitamin C serum", "Niacinamide", "Azelaic acid 10%", "Alpha arbutin", "Tranexamic acid"],
    effects: ["Cosmetic concern", "Can take 3-6 months to fade", "Often recurs without SPF"],
  },
  {
    name: "Rosacea",
    shortDescription: "Persistent facial redness with visible blood vessels and bumps.",
    longDescription:
      "Rosacea is a chronic skin condition causing redness, flushing, and small bumps, usually on the face. Triggers include sun, alcohol, spicy food, and heat.",
    tags: ["rosacea"],
    typicalSymptoms: ["redness", "burning", "pimples", "discoloration"],
    typicalLocations: ["face"],
    chronic: true,
    causes: ["Genetics", "Vascular abnormalities", "Demodex mites"],
    riskFactors: ["Fair skin", "Family history", "Age 30-50"],
    whenToSeeDoctor: ["Eye irritation (ocular rosacea)", "Bulbous nose changes", "Severe flushing"],
    prevention: ["Avoid known triggers", "Daily SPF", "Gentle skincare", "Track flare-ups"],
    treatmentsGeneral: ["Azelaic acid", "Metronidazole gel (Rx)", "Green-tinted moisturizer", "Lukewarm cleansing"],
    effects: ["Persistent redness", "Visible vessels", "Self-image concerns"],
  },
  {
    name: "Contact Dermatitis",
    shortDescription: "Rash from direct contact with an irritant or allergen.",
    longDescription:
      "Contact dermatitis appears after skin contacts an irritant (soaps, detergents) or an allergen (nickel, fragrance). It typically resolves once exposure stops.",
    tags: ["dermatitis"],
    typicalSymptoms: ["redness", "itching", "burning", "patches", "swelling"],
    typicalLocations: ["hands", "face", "neck"],
    chronic: false,
    causes: ["Irritants (soap, detergent)", "Allergens (nickel, fragrance, latex)"],
    riskFactors: ["Frequent hand washing", "Jewelry use", "Occupational exposure"],
    whenToSeeDoctor: ["Severe blistering", "Spreading rash", "Signs of infection"],
    prevention: ["Identify triggers", "Wear gloves when cleaning", "Choose fragrance-free products"],
    treatmentsGeneral: ["Cool compresses", "1% hydrocortisone", "Bland emollients", "Avoid scratching"],
    effects: ["Discomfort", "Possible secondary infection"],
  },
  {
    name: "Tinea (Fungal Infection)",
    shortDescription: "Ring-shaped fungal rash, sometimes scaly and itchy.",
    longDescription:
      "Tinea is a superficial fungal infection. Variants include tinea corporis (ringworm), tinea pedis (athlete's foot), and tinea cruris (jock itch).",
    tags: ["fungal"],
    typicalSymptoms: ["itching", "patches", "redness", "flaking"],
    typicalLocations: ["feet", "arms", "legs", "scalp"],
    chronic: false,
    causes: ["Dermatophyte fungi", "Warm moist environments"],
    riskFactors: ["Sweating", "Public showers", "Tight footwear"],
    whenToSeeDoctor: ["Spreading rash", "Scalp involvement", "No response after 2 weeks"],
    prevention: ["Keep skin dry", "Don't share towels", "Wear breathable fabrics"],
    treatmentsGeneral: ["Topical antifungal (clotrimazole, terbinafine)", "Apply 2-4 weeks", "Keep area clean and dry"],
    effects: ["Persistent itching", "Spread to other areas", "Possible secondary bacterial infection"],
  },
  {
    name: "Psoriasis",
    shortDescription: "Autoimmune condition causing rapid skin cell buildup and silvery scales.",
    longDescription:
      "Psoriasis is a chronic autoimmune disease where skin cells turn over too quickly, building up into thick, scaly plaques — most commonly on knees, elbows, and scalp. Severity ranges widely.",
    tags: ["psoriasis", "scaling", "autoimmune"],
    typicalSymptoms: ["patches", "flaking", "itching", "redness"],
    typicalLocations: ["scalp", "arms", "legs", "back"],
    chronic: true,
    causes: ["Autoimmune dysfunction", "Genetics", "Stress triggers", "Strep infections"],
    riskFactors: ["Family history", "Smoking", "Obesity", "Stress"],
    whenToSeeDoctor: ["Plaques covering >5% body", "Joint pain (psoriatic arthritis)", "Severe scalp plaques"],
    prevention: ["Manage stress", "Avoid skin injuries", "Limit alcohol", "Don't smoke"],
    treatmentsGeneral: ["Coal tar shampoo", "Salicylic acid", "Topical corticosteroids (Rx)", "Vitamin D analogs (Rx)", "Phototherapy"],
    effects: ["Thick scaly plaques", "Joint involvement", "Quality of life impact"],
  },
  {
    name: "Melasma",
    shortDescription: "Symmetrical brown facial patches, often hormonally driven.",
    longDescription:
      "Melasma is hormone-related hyperpigmentation, common during pregnancy and on hormonal contraception. It typically appears symmetrically on cheeks, forehead, and upper lip.",
    tags: ["pigmentation", "melasma"],
    typicalSymptoms: ["discoloration", "patches"],
    typicalLocations: ["face"],
    chronic: true,
    causes: ["Hormonal changes (pregnancy, OCPs)", "Sun exposure", "Genetics"],
    riskFactors: ["Pregnancy", "Hormonal contraception", "Darker skin tones", "Tropical climate"],
    whenToSeeDoctor: ["Spreading rapidly", "Persists after stopping triggers", "Cosmetic concern"],
    prevention: ["Daily mineral SPF 50", "Wide-brim hat", "Avoid heat exposure"],
    treatmentsGeneral: ["Tranexamic acid", "Azelaic acid 10%", "Hydroquinone 2-4% (Rx)", "Chemical peels"],
    effects: ["Cosmetic concern", "Often recurs", "Slow to fade"],
  },
  {
    name: "Urticaria (Hives)",
    shortDescription: "Itchy raised welts that come and go — often allergic.",
    longDescription:
      "Urticaria are pink-red raised wheals that itch intensely. Each individual hive lasts under 24 hours but new ones may keep appearing. Triggers include foods, medications, infections, and stress.",
    tags: ["allergic", "hives"],
    typicalSymptoms: ["itching", "swelling", "patches", "redness"],
    typicalLocations: ["arms", "legs", "chest", "back"],
    chronic: false,
    causes: ["Food allergens", "Medications", "Insect bites", "Infections", "Stress"],
    riskFactors: ["Atopic history", "Existing allergies"],
    whenToSeeDoctor: ["Difficulty breathing", "Lip/tongue swelling", "Hives lasting >6 weeks", "Fever with hives"],
    prevention: ["Identify triggers", "Avoid known allergens", "Cool environments"],
    treatmentsGeneral: ["Non-drowsy antihistamines (cetirizine, loratadine)", "Cool compresses", "Avoid scratching"],
    effects: ["Intense itching", "Sleep disruption", "Risk of anaphylaxis if systemic"],
  },
  {
    name: "Keratosis Pilaris",
    shortDescription: "Tiny rough bumps — 'chicken skin' — usually on arms and thighs.",
    longDescription:
      "Keratosis pilaris is a harmless condition where keratin plugs hair follicles. It often runs in families and tends to improve with age.",
    tags: ["keratosis", "dry skin"],
    typicalSymptoms: ["patches", "dryness", "redness"],
    typicalLocations: ["arms", "legs", "back"],
    chronic: true,
    causes: ["Excess keratin", "Genetics", "Dry skin"],
    riskFactors: ["Family history", "Eczema-prone skin", "Cold dry climates"],
    whenToSeeDoctor: ["Severe itching", "Significant cosmetic concern"],
    prevention: ["Don't scrub harshly", "Daily moisturizer", "Humidifier in dry climates"],
    treatmentsGeneral: ["Lactic acid 12%", "Urea cream 10-20%", "Salicylic acid lotion", "Gentle exfoliation"],
    effects: ["Cosmetic concern", "Mild roughness", "Often improves with age"],
  },
  {
    name: "Perioral Dermatitis",
    shortDescription: "Small red bumps and scaling around the mouth.",
    longDescription:
      "Perioral dermatitis is an inflammatory rash around the mouth (sparing the lip border), often triggered by topical steroids or heavy occlusive products.",
    tags: ["dermatitis"],
    typicalSymptoms: ["redness", "pimples", "burning", "flaking"],
    typicalLocations: ["face"],
    chronic: false,
    causes: ["Topical steroid use", "Heavy creams", "Fluoride toothpaste", "Hormones"],
    riskFactors: ["Female, age 20-40", "Recent steroid use", "Heavy skincare routine"],
    whenToSeeDoctor: ["No improvement in 4 weeks", "Severe inflammation", "Recurrence"],
    prevention: ["Avoid topical steroids on face", "Use minimalist skincare", "Switch to fluoride-free toothpaste"],
    treatmentsGeneral: ["Stop all topical steroids", "Azelaic acid 15%", "Metronidazole (Rx)", "Gentle bland cleanser"],
    effects: ["Persistent rash", "Burning sensation", "Cosmetic concern"],
  },
  {
    name: "Vitiligo",
    shortDescription: "Patches of skin that lose their pigment, becoming pale white.",
    longDescription:
      "Vitiligo is an autoimmune condition where pigment-producing cells (melanocytes) are destroyed, causing depigmented patches. It can affect any body area and often progresses slowly.",
    tags: ["pigmentation", "autoimmune"],
    typicalSymptoms: ["discoloration", "patches"],
    typicalLocations: ["hands", "face", "feet", "neck"],
    chronic: true,
    causes: ["Autoimmune", "Genetics", "Oxidative stress", "Triggers (sunburn, injury)"],
    riskFactors: ["Family history", "Other autoimmune disease", "Stress"],
    whenToSeeDoctor: ["Newly appearing white patches", "Spreading rapidly", "Cosmetic concern"],
    prevention: ["Daily high SPF on patches", "Avoid skin trauma", "Manage stress"],
    treatmentsGeneral: ["Topical corticosteroids (Rx)", "Tacrolimus ointment (Rx)", "Phototherapy", "Camouflage cosmetics"],
    effects: ["Cosmetic concern", "Higher sunburn risk on patches", "Quality of life impact"],
  },
  {
    name: "Athlete's Foot (Tinea Pedis)",
    shortDescription: "Itchy, scaling, sometimes peeling rash between the toes.",
    longDescription:
      "A common fungal infection of the feet, especially between toes, picked up in damp environments like locker rooms and shared showers.",
    tags: ["fungal", "feet"],
    typicalSymptoms: ["itching", "flaking", "patches", "redness"],
    typicalLocations: ["feet"],
    chronic: false,
    causes: ["Dermatophyte fungi", "Damp footwear", "Sweaty feet"],
    riskFactors: ["Communal showers", "Closed shoes for long hours", "Hyperhidrosis"],
    whenToSeeDoctor: ["Spreading to nails or groin", "No response after 2 weeks", "Severe pain or infection"],
    prevention: ["Dry feet thoroughly", "Rotate shoes", "Cotton socks", "Antifungal powder"],
    treatmentsGeneral: ["Topical terbinafine 1%", "Clotrimazole 1%", "Apply 2-4 weeks", "Air out shoes"],
    effects: ["Persistent itch", "Spread to toenails", "Secondary bacterial infection"],
  },
  {
    name: "Cold Sores (Oral Herpes)",
    shortDescription: "Painful blisters around the mouth caused by HSV-1.",
    longDescription:
      "Cold sores are caused by HSV-1 and recur when triggered by stress, sun, illness, or hormonal changes. They progress through tingle → blister → crust → heal stages over 7-14 days.",
    tags: ["viral", "herpes"],
    typicalSymptoms: ["burning", "blisters", "patches", "swelling"],
    typicalLocations: ["face"],
    chronic: true,
    causes: ["HSV-1 reactivation", "UV exposure", "Stress", "Illness"],
    riskFactors: ["Prior HSV-1 infection", "Sun exposure", "Stress"],
    whenToSeeDoctor: ["Frequent recurrences", "Eye involvement", "Outbreaks lasting >2 weeks"],
    prevention: ["SPF on lips", "Manage stress", "Don't share lip products", "Lysine supplements"],
    treatmentsGeneral: ["Docosanol 10% (OTC)", "Acyclovir cream (Rx)", "Oral antivirals at first tingle (Rx)", "Cold compresses"],
    effects: ["Pain and tingling", "Cosmetic concern", "Highly contagious during active outbreak"],
  },
];

const articles = [
  {
    title: "How to build a simple morning routine",
    slug: "simple-morning-routine",
    excerpt: "Three steps that work for almost every skin type — without overspending.",
    contentHtml: `<h2>Three steps</h2><p>Cleanser, moisturizer, sunscreen — that's the entire blueprint. Skip actives in the morning; save them for night.</p><h2>1. Gentle cleanser</h2><p>Look for a low-pH (4.5–6) cleanser with minimal surfactants. Cetaphil and CeraVe are great budget options.</p><h2>2. Moisturizer with niacinamide</h2><p>Niacinamide calms redness and balances oil. A pea-sized amount across the whole face is enough.</p><h2>3. Broad-spectrum SPF 50</h2><p>This is non-negotiable. Two finger-lengths (about 1 ml) for the face, reapply every 2 hours outdoors.</p><p>Consistency beats complexity. Three steps, every morning, for 8 weeks — then re-evaluate.</p>`,
    tags: ["routine", "beginner"],
    isPremium: false,
  },
  {
    title: "Niacinamide vs. Vitamin C: which to pick",
    slug: "niacinamide-vs-vitamin-c",
    excerpt: "Both are great, but they shine for different goals.",
    contentHtml: `<h2>Niacinamide</h2><p>Calms redness, balances oil, and strengthens the skin barrier. Tolerated by almost every skin type. 5–10% is the sweet spot.</p><h2>Vitamin C (L-ascorbic acid)</h2><p>Brightens, fades pigmentation, and adds antioxidant protection. Needs sunscreen to work. 10–20% is effective; finicky to formulate.</p><h2>Verdict</h2><p>Use niacinamide if you want a hassle-free daily booster. Use vitamin C if your goal is brightening + antioxidant defense. They <em>can</em> be layered, contrary to old myths.</p>`,
    tags: ["actives", "education"],
    isPremium: false,
  },
  {
    title: "The ultimate retinoid guide",
    slug: "ultimate-retinoid-guide",
    excerpt: "Every step from beginner to advanced — what to expect and how to titrate.",
    contentHtml: `<h2>What retinoids do</h2><p>Retinoids speed up cell turnover, unclog pores, and stimulate collagen. They're the gold standard for both acne and aging.</p><h2>Beginner protocol</h2><ul><li>Start with adapalene 0.1% (OTC, prescription-strength)</li><li>Apply 2× per week for the first 2 weeks</li><li>Sandwich: moisturizer → retinoid → moisturizer</li></ul><h2>Building tolerance</h2><p>Increase to 3–4× per week in week 3, nightly by week 8 if no irritation. Expect a "purge" phase weeks 4–8.</p><h2>Always pair with SPF</h2><p>Retinoids increase sun sensitivity. Without daily SPF, you're undoing the work.</p>`,
    tags: ["retinoid", "advanced", "premium"],
    isPremium: true,
  },
  {
    title: "Advanced Acne Treatment: Beyond Basic Skincare",
    slug: "advanced-acne-treatment",
    excerpt: "Deep dive into evidence-based acne treatments beyond drugstore basics.",
    contentHtml: `<h2>When OTC stops working</h2><p>If you've been consistent for 12 weeks with adapalene + benzoyl peroxide and still see active lesions, it's time for prescription help.</p><h2>Topicals</h2><ul><li><strong>Tretinoin</strong> — gold standard, more potent than adapalene</li><li><strong>Clindamycin</strong> — antibacterial, often combined with BPO</li><li><strong>Azelaic acid 15-20%</strong> — calming, treats PIH simultaneously</li></ul><h2>Oral options</h2><ul><li>Spironolactone for hormonal acne (women)</li><li>Doxycycline for inflammatory acne (short-term)</li><li>Isotretinoin for severe nodulocystic acne</li></ul><h2>Procedural</h2><p>Chemical peels (salicylic, mandelic), microneedling, and IPL can supplement. They don't replace topicals.</p>`,
    tags: ["acne", "advanced", "treatment"],
    isPremium: true,
  },
  {
    title: "Scalp Health: How to Combat Dandruff for Good",
    slug: "combat-dandruff-for-good",
    excerpt: "Evidence-based strategies to eliminate dandruff and maintain a healthy scalp.",
    contentHtml: `<h2>Why you have dandruff</h2><p>Dandruff is usually seborrheic dermatitis — Malassezia yeast overgrowing on an oily scalp. It's not about cleanliness.</p><h2>The shampoo rotation</h2><ul><li><strong>Ketoconazole 1%</strong> — antifungal, the most effective</li><li><strong>Zinc pyrithione</strong> — gentle daily option</li><li><strong>Salicylic acid</strong> — exfoliates buildup</li><li><strong>Selenium sulfide</strong> — for stubborn cases</li></ul><p>Rotate two of these weekly. Leave on the scalp for 3-5 minutes before rinsing.</p><h2>Beyond shampoo</h2><p>Don't over-wash. Manage stress. Avoid heavy oils on the scalp. If flakes persist after 6 weeks, see a dermatologist.</p>`,
    tags: ["dandruff", "scalp", "hair care"],
    isPremium: false,
  },
  {
    title: "The Truth About Sunscreen in Indian Climate",
    slug: "sunscreen-indian-climate",
    excerpt: "Why SPF 50 isn't enough — and what works for tropical UV index.",
    contentHtml: `<h2>UV in India is intense</h2><p>UV index in most Indian cities sits at 8-12 for half the year. SPF 30 stops mattering after the first hour.</p><h2>What to actually look for</h2><ul><li>SPF 50+, PA++++ (the PA rating matters for UVA)</li><li>2 finger-lengths for face + neck</li><li>Reapply every 2 hours when outdoors</li><li>Re-apply after sweating or swimming</li></ul><h2>Indian skin tones</h2><p>Mineral sunscreens with iron oxides (the tinted ones) protect against visible light too — important for melasma and PIH on tan to deep skin.</p>`,
    tags: ["routine", "education", "treatment"],
    isPremium: false,
  },
  {
    title: "Decoding Ingredient Lists: A Quick Guide",
    slug: "decoding-ingredient-lists",
    excerpt: "How to read INCI, spot fillers, and judge a product without the marketing.",
    contentHtml: `<h2>The first 5 ingredients matter most</h2><p>Ingredients are listed by concentration. The first five usually make up 80% of the product. Anything below the 1% line (typically after a preservative) is in trace amounts.</p><h2>Common red flags</h2><ul><li>Fragrance/parfum near the top — irritation risk</li><li>Denatured alcohol in the first 5 — drying for most skin</li><li>Active claim with active ingredient at the bottom</li></ul><h2>Useful greens</h2><p>Glycerin, ceramides, niacinamide, panthenol, hyaluronic acid — workhorses with strong evidence.</p>`,
    tags: ["education", "beginner"],
    isPremium: false,
  },
  {
    title: "Hair Care: What Actually Works for Hair Fall",
    slug: "hair-fall-what-works",
    excerpt: "Evidence-backed treatments vs. marketing fluff for thinning hair.",
    contentHtml: `<h2>Stop wasting money on these</h2><ul><li>Shampoos that "stop hair fall" — your scalp microbiome doesn't care</li><li>Onion oil — anecdotal, no controlled trials</li><li>Biotin (unless deficient) — most have plenty</li></ul><h2>What's actually proven</h2><ul><li><strong>Minoxidil 5%</strong> topical — works for both genders, 4-6 month commitment</li><li><strong>Finasteride</strong> (men) — DHT-related hair loss</li><li><strong>Ketoconazole shampoo</strong> — antifungal + mild DHT effect</li></ul><h2>Bonus</h2><p>If your hair fall started suddenly, get bloodwork done — iron, ferritin, thyroid, vitamin D.</p>`,
    tags: ["hair care", "advanced"],
    isPremium: true,
  },
  {
    title: "Why Your Acne Came Back After Isotretinoin",
    slug: "acne-recurrence-after-isotretinoin",
    excerpt: "Recurrence happens to ~30%. Here's what to do — and why.",
    contentHtml: `<h2>It's normal</h2><p>About 30% of patients see acne return within 1-2 years post-course. It's not failure — it's biology.</p><h2>Maintenance plan</h2><ul><li>Topical retinoid (adapalene or tretinoin) 3-4× weekly</li><li>Salicylic acid cleanser, daily</li><li>Daily SPF</li></ul><h2>Hormonal triggers</h2><p>If recurrence aligns with cycle or jaw breakouts, discuss spironolactone with your dermatologist.</p>`,
    tags: ["acne", "advanced", "treatment"],
    isPremium: true,
  },
  {
    title: "Beginner's Guide to Reading Skincare Labels",
    slug: "beginner-skincare-labels",
    excerpt: "Make better choices in the aisle without a chemistry degree.",
    contentHtml: `<h2>Decode the front</h2><p>"Brightening" usually means contains vitamin C, niacinamide, or arbutin. "Anti-aging" implies retinol or peptides. Marketing words have no legal definitions — check the back.</p><h2>Decode the back</h2><p>Look for: <em>active</em> at >2-5%, <em>pH</em> if listed, <em>fragrance-free</em> for sensitive skin. Avoid: high alcohol denat., heavy fragrance for sensitive skin.</p><h2>Cost ≠ quality</h2><p>Many of the most-studied actives are dirt cheap (niacinamide, BHA, adapalene). Pay for formulation and tolerance, not luxury.</p>`,
    tags: ["education", "beginner"],
    isPremium: false,
  },
];

const badges = [
  { name: "First Scan", description: "Completed your first scan", icon: "camera", conditionType: "scan_count", threshold: 1 },
  { name: "Consistent", description: "7-day routine streak", icon: "flame", conditionType: "streak", threshold: 7 },
  { name: "Community Helper", description: "10 upvotes on your posts", icon: "users", conditionType: "community", threshold: 10 },
  { name: "Journey Complete", description: "Finished all 3 follow-ups for a condition", icon: "trophy", conditionType: "followup", threshold: 3 },
  { name: "Power User", description: "Completed 10 scans", icon: "sparkles", conditionType: "scan_count", threshold: 10 },
  { name: "Early Detector", description: "Caught a flagged condition early", icon: "award", conditionType: "scan_count", threshold: 1 },
];

const dermatologists = [
  { name: "Dr. Aisha Rahman", credentials: "MD, FAAD", specialization: "General Dermatology, Acne", responseTimeHours: 24, isAvailable: true },
  { name: "Dr. James Walker", credentials: "MD", specialization: "Pediatric Dermatology, Eczema", responseTimeHours: 48, isAvailable: true },
];

const skinGroups = [
  { name: "Oily Skin & Acne", skinType: "oily", conditionTags: ["acne", "oily skin"], description: "For folks battling shine and breakouts." },
  { name: "Dry & Sensitive", skinType: "dry", conditionTags: ["eczema", "dry skin"], description: "Hydration-focused community." },
  { name: "Pigmentation Journey", skinType: "any", conditionTags: ["pigmentation"], description: "Sharing fade-tracking progress." },
];

// Pseudo-users for community posts (so it doesn't all look like the demo user)
const pseudoUsers = [
  { email: "priya.s@dermai.app", fullName: "Priya Sharma", skinType: "oily", concerns: ["acne", "pigmentation"] },
  { email: "arjun.k@dermai.app", fullName: "Arjun Kapoor", skinType: "combination", concerns: ["acne"] },
  { email: "meera.r@dermai.app", fullName: "Meera Reddy", skinType: "dry", concerns: ["eczema", "sensitivity"] },
  { email: "vikram.p@dermai.app", fullName: "Vikram Patel", skinType: "normal", concerns: ["dandruff"] },
  { email: "anaya.j@dermai.app", fullName: "Anaya Joshi", skinType: "sensitive", concerns: ["rosacea"] },
];

const communityPosts = [
  {
    authorEmail: "priya.s@dermai.app",
    title: "Niacinamide changed my oily skin — 4 week update",
    body: "I've been using 10% niacinamide every morning for a month. T-zone shine reduced by maybe 40%. Pores look smaller in good lighting. Most importantly, no purging. Highly recommend if you're new to actives.",
    tags: ["acne", "oily skin"],
    isAnonymous: false,
    upvotes: 18,
    comments: [
      { authorEmail: "arjun.k@dermai.app", body: "Same here! Switched from The Ordinary 10% to Minimalist 5% and tolerance is way better.", upvotes: 4 },
      { authorEmail: "meera.r@dermai.app", body: "How does it pair with vitamin C for you? I keep reading mixed things.", upvotes: 2 },
      { authorEmail: "priya.s@dermai.app", body: "Honestly fine when alternated AM/PM. The 'don't mix them' thing is a myth from a bad 1960s study.", upvotes: 7 },
    ],
  },
  {
    authorEmail: "arjun.k@dermai.app",
    title: "Anyone else getting jaw acne despite a clean routine?",
    body: "21M, oily skin, using adapalene + BPO for 3 months. Forehead and cheeks cleared up but jawline keeps breaking out monthly. Diet is decent. Could this be hormonal?",
    tags: ["acne"],
    isAnonymous: false,
    upvotes: 12,
    comments: [
      { authorEmail: "priya.s@dermai.app", body: "Sounds hormonal. Worth talking to a derm — spiro works great for both genders. There's also DIM as a supplement option.", upvotes: 8 },
      { authorEmail: "anaya.j@dermai.app", body: "Pillowcase hygiene check too — change weekly minimum.", upvotes: 3 },
    ],
  },
  {
    authorEmail: "meera.r@dermai.app",
    title: "Eczema flare after switching detergents — anyone else?",
    body: "Switched to a 'natural' detergent and within 2 weeks my arms are eczematic again. Going back to the boring fragrance-free one.",
    tags: ["eczema", "dry skin"],
    isAnonymous: false,
    upvotes: 9,
    comments: [
      { authorEmail: "vikram.p@dermai.app", body: "Natural ≠ gentle. Essential oils are some of the most allergenic things you can put on skin.", upvotes: 11 },
    ],
  },
  {
    authorEmail: "vikram.p@dermai.app",
    title: "Ketoconazole shampoo: 4 weeks before/after for dandruff",
    body: "Tried zinc pyrithione for months with mild improvement. Switched to ketoconazole 1% twice a week. Flakes basically gone in 4 weeks. Leave it on the scalp 5 minutes before rinsing.",
    tags: ["dandruff", "scalp"],
    isAnonymous: false,
    upvotes: 24,
    comments: [
      { authorEmail: "arjun.k@dermai.app", body: "What brand? Nizoral isn't easy to find here.", upvotes: 1 },
      { authorEmail: "vikram.p@dermai.app", body: "Pharmacy brand 'Ketokem' worked just as well. Same active.", upvotes: 5 },
    ],
  },
  {
    authorEmail: "anaya.j@dermai.app",
    title: "Rosacea triggers — keeping a diary helped me identify spicy food + alcohol",
    body: "I'd written off the connection because flares were random. Tracked daily for 8 weeks. Spicy food = flush within 2 hours. Wine = flush within an hour. Coffee was actually fine for me.",
    tags: ["rosacea"],
    isAnonymous: false,
    upvotes: 16,
    comments: [
      { authorEmail: "meera.r@dermai.app", body: "Heat is mine. Hot showers + summer = nightmare.", upvotes: 4 },
    ],
  },
  {
    authorEmail: "priya.s@dermai.app",
    title: "Tranexamic acid for melasma — my 12 week progress",
    body: "Started oral tranexamic acid (under derm supervision) + topical 5% serum. 12 weeks in: maybe 60% lighter. Not gone but a huge difference. SPF every day, no exceptions.",
    tags: ["pigmentation"],
    isAnonymous: false,
    upvotes: 31,
    comments: [
      { authorEmail: "anaya.j@dermai.app", body: "Did you have any side effects on the oral?", upvotes: 2 },
      { authorEmail: "priya.s@dermai.app", body: "Mild headaches first 2 weeks then nothing. Bloodwork was checked before starting.", upvotes: 4 },
    ],
  },
  {
    authorEmail: "arjun.k@dermai.app",
    title: "Cheap minimalist routine that actually worked for me",
    body: "₹600/month total. Cetaphil cleanser. Minimalist niacinamide 5%. Re'equil sunscreen. Adapalene 0.1% at night. 3 months in, my acne is 80% better. Don't need 12 products.",
    tags: ["acne", "routine"],
    isAnonymous: false,
    upvotes: 42,
    comments: [
      { authorEmail: "vikram.p@dermai.app", body: "This. So underrated. Most expensive routines I see online are mostly nonsense.", upvotes: 12 },
      { authorEmail: "meera.r@dermai.app", body: "Saving this — kid is starting puberty and we don't need to bankrupt ourselves.", upvotes: 6 },
    ],
  },
  {
    authorEmail: null, // anonymous
    title: "Embarrassed about scalp psoriasis — anyone else struggle in summer?",
    body: "I avoid wearing dark shirts because the flakes are so visible. Coal tar shampoo helps but the smell is awful. How do you all cope, especially with people noticing?",
    tags: ["psoriasis", "scalp"],
    isAnonymous: true,
    upvotes: 22,
    comments: [
      { authorEmail: "vikram.p@dermai.app", body: "Genuinely — most people don't notice as much as we think. The shame voice in our heads is loud. Salicylic acid scalp solution works without the smell, try it.", upvotes: 18 },
      { authorEmail: "anaya.j@dermai.app", body: "Hugs. It got better for me when I stopped trying to hide it. Wore black anyway. Nobody mentioned anything in 6 months.", upvotes: 9 },
    ],
  },
  {
    authorEmail: "meera.r@dermai.app",
    title: "Best fragrance-free moisturizers for sensitive skin in India?",
    body: "Looking for recommendations. Cetaphil and CeraVe are getting expensive. Anything Indian-made that's actually fragrance-free (not just 'no added fragrance')?",
    tags: ["dry skin"],
    isAnonymous: false,
    upvotes: 14,
    comments: [
      { authorEmail: "priya.s@dermai.app", body: "Re'equil ceramide moisturizer. Truly fragrance-free, ~₹500.", upvotes: 7 },
      { authorEmail: "arjun.k@dermai.app", body: "Sebamed clear face cream is solid too.", upvotes: 4 },
    ],
  },
  {
    authorEmail: null,
    title: "Adult acne at 32, didn't expect it",
    body: "Never had bad acne as a teen. Last 6 months it's hit me hard on cheeks and chin. Stress has been high. Anyone been through this and what worked?",
    tags: ["acne"],
    isAnonymous: true,
    upvotes: 19,
    comments: [
      { authorEmail: "priya.s@dermai.app", body: "Adult acne is often stress + hormones. Saw a derm, got on spiro + tretinoin, took 4 months but cleared up. Worth the appointment.", upvotes: 11 },
      { authorEmail: "anaya.j@dermai.app", body: "Same age, same situation. Cut sugar (not perfectly), added zinc supplement, big improvement.", upvotes: 5 },
    ],
  },
];

async function main() {
  // Conditions
  for (const c of conditions) {
    await prisma.condition.upsert({
      where: { name: c.name },
      create: {
        name: c.name,
        shortDescription: c.shortDescription,
        longDescription: c.longDescription,
        tags: JSON.stringify(c.tags),
        typicalSymptoms: JSON.stringify(c.typicalSymptoms),
        typicalLocations: JSON.stringify(c.typicalLocations),
        chronic: c.chronic,
        causes: JSON.stringify(c.causes),
        riskFactors: JSON.stringify(c.riskFactors),
        whenToSeeDoctor: JSON.stringify(c.whenToSeeDoctor),
        prevention: JSON.stringify(c.prevention),
        treatmentsGeneral: JSON.stringify(c.treatmentsGeneral),
        effects: JSON.stringify(c.effects),
      },
      update: {
        shortDescription: c.shortDescription,
        longDescription: c.longDescription,
        tags: JSON.stringify(c.tags),
        typicalSymptoms: JSON.stringify(c.typicalSymptoms),
        typicalLocations: JSON.stringify(c.typicalLocations),
        chronic: c.chronic,
        causes: JSON.stringify(c.causes),
        riskFactors: JSON.stringify(c.riskFactors),
        whenToSeeDoctor: JSON.stringify(c.whenToSeeDoctor),
        prevention: JSON.stringify(c.prevention),
        treatmentsGeneral: JSON.stringify(c.treatmentsGeneral),
        effects: JSON.stringify(c.effects),
      },
    });
  }

  // Articles
  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      create: { ...a, tags: JSON.stringify(a.tags) },
      update: { ...a, tags: JSON.stringify(a.tags) },
    });
  }

  // Badges
  for (const b of badges) {
    await prisma.badge.upsert({ where: { name: b.name }, create: b, update: b });
  }

  // Dermatologists
  for (const d of dermatologists) {
    const existing = await prisma.dermatologist.findFirst({ where: { name: d.name } });
    if (!existing) await prisma.dermatologist.create({ data: d });
  }

  // Skin groups
  for (const g of skinGroups) {
    await prisma.skinGroup.upsert({
      where: { name: g.name },
      create: { ...g, conditionTags: JSON.stringify(g.conditionTags) },
      update: { ...g, conditionTags: JSON.stringify(g.conditionTags) },
    });
  }

  // Demo + pseudo users
  const hashed = await bcrypt.hash("password123", 10);
  const demoUsers = [
    { email: "demo@dermai.app", fullName: "Aanya Demo", role: "user", premium: true, profile: { age: 24, gender: "female", skinType: "combination", concerns: ["acne", "pigmentation"] } },
    { email: "free@dermai.app", fullName: "Rohan Free", role: "user", premium: false, profile: { age: 19, gender: "male", skinType: "oily", concerns: ["acne"] } },
    { email: "admin@dermai.app", fullName: "Admin", role: "admin", premium: true, profile: { age: 30, gender: "other", skinType: "normal", concerns: [] } },
  ];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        hashedPassword: hashed,
        fullName: u.fullName,
        role: u.role,
        profile: {
          create: {
            age: u.profile.age,
            gender: u.profile.gender,
            skinType: u.profile.skinType,
            concerns: JSON.stringify(u.profile.concerns),
          },
        },
        healthScore: { create: {} },
      },
      update: { hashedPassword: hashed, fullName: u.fullName, role: u.role },
    });
    if (u.premium) {
      const endDate = new Date(Date.now() + 30 * 24 * 3600 * 1000);
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, planId: "premium_monthly", status: "active", endDate, currency: "INR", amount: 299 },
        update: { planId: "premium_monthly", status: "active", startDate: new Date(), endDate, currency: "INR", amount: 299 },
      });
    }
  }

  // Pseudo users for community
  for (const p of pseudoUsers) {
    await prisma.user.upsert({
      where: { email: p.email },
      create: {
        email: p.email,
        hashedPassword: hashed,
        fullName: p.fullName,
        profile: {
          create: { skinType: p.skinType, concerns: JSON.stringify(p.concerns) },
        },
      },
      update: { fullName: p.fullName },
    });
  }

  // Demo user content (idempotent — only seed if no scans yet)
  const demo = await prisma.user.findUnique({ where: { email: "demo@dermai.app" } });
  if (demo) {
    const existingScans = await prisma.diagnosisRecord.count({ where: { userId: demo.id } });
    if (existingScans === 0) {
      const acne = await prisma.diagnosisRecord.create({
        data: {
          userId: demo.id,
          bodyPart: "face",
          durationDays: 21,
          symptoms: JSON.stringify(["pimples", "oily", "blackheads"]),
          predictedCondition: "Acne Vulgaris",
          confidence: 0.82,
          description: "Common pimples driven by oil and clogged pores.",
          possibleEffects: JSON.stringify(["Scarring if picked", "Post-inflammatory pigmentation"]),
          prevention: JSON.stringify(["Wash twice daily", "Avoid picking"]),
          solutions: JSON.stringify(["Salicylic acid 2%", "Niacinamide serum"]),
          disclaimer: "AI-assisted suggestion only, not a medical diagnosis.",
          createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
        },
      });
      await prisma.diagnosisRecord.create({
        data: {
          userId: demo.id,
          bodyPart: "scalp",
          durationDays: 60,
          symptoms: JSON.stringify(["flaking", "itching", "oily"]),
          predictedCondition: "Seborrheic Dermatitis (Dandruff)",
          confidence: 0.75,
          description: "Flaky scalp from yeast overgrowth.",
          possibleEffects: JSON.stringify(["Visible flakes", "Scalp itching"]),
          prevention: JSON.stringify(["Wash hair regularly"]),
          solutions: JSON.stringify(["Ketoconazole 1% shampoo"]),
          disclaimer: "AI-assisted suggestion only, not a medical diagnosis.",
          createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        },
      });
      await prisma.diagnosisRecord.create({
        data: {
          userId: demo.id,
          bodyPart: "face",
          durationDays: 7,
          symptoms: JSON.stringify(["discoloration", "patches"]),
          predictedCondition: "Hyperpigmentation",
          confidence: 0.71,
          description: "Darkened patches from excess melanin.",
          possibleEffects: JSON.stringify(["Cosmetic concern", "Slow to fade"]),
          prevention: JSON.stringify(["Daily SPF 50", "Don't pick"]),
          solutions: JSON.stringify(["Vitamin C serum", "Azelaic acid"]),
          disclaimer: "AI-assisted suggestion only, not a medical diagnosis.",
          createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        },
      });

      const now = new Date();
      await prisma.followUp.createMany({
        data: [
          { userId: demo.id, originalDiagnosisId: acne.id, scheduledDate: new Date(now.getTime() - 7 * 24 * 3600 * 1000), status: "completed", completedDate: new Date(now.getTime() - 7 * 24 * 3600 * 1000), selfRating: 4, notes: "Redness reduced, fewer breakouts." },
          { userId: demo.id, originalDiagnosisId: acne.id, scheduledDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000), status: "pending" },
          { userId: demo.id, originalDiagnosisId: acne.id, scheduledDate: new Date(now.getTime() + 16 * 24 * 3600 * 1000), status: "pending" },
        ],
      });

      // Pre-generated routines for demo (premium)
      await prisma.routine.create({
        data: {
          userId: demo.id,
          type: "morning",
          steps: JSON.stringify([
            { step_number: 1, step_type: "cleanser", description: "Gentle salicylic acid cleanser (Cetaphil DermaControl or similar)" },
            { step_number: 2, step_type: "treatment", description: "Niacinamide 10% serum, 2-3 drops across face" },
            { step_number: 3, step_type: "treatment", description: "Vitamin C 15% serum (apply on alternate days for hyperpigmentation)" },
            { step_number: 4, step_type: "moisturizer", description: "Lightweight gel moisturizer" },
            { step_number: 5, step_type: "sunscreen", description: "Broad-spectrum SPF 50 PA++++ — two finger-lengths, reapply every 2 hours outdoors" },
          ]),
        },
      });
      await prisma.routine.create({
        data: {
          userId: demo.id,
          type: "night",
          steps: JSON.stringify([
            { step_number: 1, step_type: "cleanser", description: "Same gentle cleanser, double cleanse if wearing SPF or makeup" },
            { step_number: 2, step_type: "treatment", description: "Adapalene 0.1% (start every other night, build up to nightly over 8 weeks)" },
            { step_number: 3, step_type: "moisturizer", description: "Ceramide moisturizer to buffer retinoid irritation" },
          ]),
        },
      });

      // Award badges (First Scan, Consistent, Power User-not-yet, Early Detector)
      const firstScan = await prisma.badge.findUnique({ where: { name: "First Scan" } });
      const consistent = await prisma.badge.findUnique({ where: { name: "Consistent" } });
      const earlyDetector = await prisma.badge.findUnique({ where: { name: "Early Detector" } });
      if (firstScan) await prisma.userAchievement.upsert({ where: { userId_badgeId: { userId: demo.id, badgeId: firstScan.id } }, create: { userId: demo.id, badgeId: firstScan.id }, update: {} });
      if (consistent) await prisma.userAchievement.upsert({ where: { userId_badgeId: { userId: demo.id, badgeId: consistent.id } }, create: { userId: demo.id, badgeId: consistent.id }, update: {} });
      if (earlyDetector) await prisma.userAchievement.upsert({ where: { userId_badgeId: { userId: demo.id, badgeId: earlyDetector.id } }, create: { userId: demo.id, badgeId: earlyDetector.id }, update: {} });
    }
  }

  // Community posts (only seed if there are very few)
  const postCount = await prisma.communityPost.count();
  if (postCount < communityPosts.length) {
    // Wipe & reseed for clean demo
    await prisma.communityComment.deleteMany();
    await prisma.communityPost.deleteMany();

    for (const p of communityPosts) {
      const author = p.authorEmail
        ? await prisma.user.findUnique({ where: { email: p.authorEmail } })
        : await prisma.user.findUnique({ where: { email: "anaya.j@dermai.app" } });
      if (!author) continue;
      const post = await prisma.communityPost.create({
        data: {
          userId: author.id,
          title: p.title,
          body: p.body,
          tags: JSON.stringify(p.tags),
          isAnonymous: p.isAnonymous,
          upvotes: p.upvotes,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 3600 * 1000),
        },
      });
      for (const c of p.comments) {
        const cAuthor = await prisma.user.findUnique({ where: { email: c.authorEmail } });
        if (!cAuthor) continue;
        await prisma.communityComment.create({
          data: {
            postId: post.id,
            userId: cAuthor.id,
            body: c.body,
            upvotes: c.upvotes,
            createdAt: new Date(post.createdAt.getTime() + Math.floor(Math.random() * 24) * 3600 * 1000),
          },
        });
      }
    }
  }

  console.log("Seed complete:", {
    conditions: conditions.length,
    articles: articles.length,
    badges: badges.length,
    dermatologists: dermatologists.length,
    skinGroups: skinGroups.length,
    pseudoUsers: pseudoUsers.length,
    communityPosts: communityPosts.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

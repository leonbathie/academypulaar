/**
 * Rich educational content for each terminology domain.
 * Keys match the DOMAIN_CONFIG slugs in DomainPage.jsx.
 * Each language (fr, en, ff) has its own content set.
 */

const domainContent = {
    'sciences-technologie': {
        fr: {
            introduction: {
                title: 'La science en Fulfulde : un défi moderne',
                paragraphs: [
                    "La langue Fulfulde, parlée par plus de 40 millions de personnes à travers l'Afrique de l'Ouest et centrale, possède une richesse lexicale souvent méconnue. Le vocabulaire scientifique en Fulfulde s'appuie sur des racines anciennes qui décrivent le monde naturel avec une précision remarquable.",
                    "L'Académie Goomu Fulo & Wiɗto travaille depuis plus de 10 ans à créer et normaliser des termes techniques qui permettent d'enseigner les sciences — mathématiques, physique, biologie, informatique — directement en Fulfulde, sans passer par le français ou l'anglais."
                ]
            },
            didYouKnow: [
                {
                    icon: '🧮',
                    title: 'Les chiffres Fulfulde',
                    text: "Le système de numération Fulfulde est décimal et parfaitement régulier. « Go'o » (1), « ɗiɗi » (2), « tati » (3)… Le mot « teemedere » (100) et « ujunere » (1000) permettent d'exprimer n'importe quel nombre."
                },
                {
                    icon: '🌿',
                    title: 'Botanique traditionnelle',
                    text: "Les Peuls nomades ont développé un vocabulaire botanique très riche. Par exemple, ils distinguent plus de 20 types d'herbes de pâturage selon leur valeur nutritive pour le bétail."
                },
                {
                    icon: '⭐',
                    title: 'Astronomie pastorale',
                    text: "Les bergers Peuls utilisent les étoiles (koode) pour la navigation et la prédiction des saisons. « Jaayre » désigne la Voie Lactée et servait de calendrier naturel pour les transhumances."
                }
            ],
            exampleSentences: [
                {
                    ff: "Naange ina wutti, leydi ina yiiloo.",
                    fr: "Le soleil brille, la terre tourne.",
                    context: "Astronomie — description du système solaire"
                },
                {
                    ff: "Lekki ki ina fusa, ɓiɓɓe mum ina caree.",
                    fr: "L'arbre fleurit, ses fruits se dispersent.",
                    context: "Biologie — cycle de reproduction des plantes"
                },
                {
                    ff: "Limoore nder hiisa ko huunde tiiɗnde.",
                    fr: "Le calcul en mathématiques est fondamental.",
                    context: "Mathématiques — importance du calcul"
                }
            ],
            pronunciation: {
                title: 'Guide de prononciation scientifique',
                intro: 'Les termes scientifiques en Fulfulde suivent les règles phonologiques de la langue. Voici les sons clés :',
                sounds: [
                    { symbol: 'ɓ', description: 'B implosif — la bouche se ferme puis l\'air rentre (comme avaler)', example: 'ɓiɗɗo (enfant)' },
                    { symbol: 'ɗ', description: 'D implosif — la langue touche le palais, l\'air est aspiré', example: 'ɗemngal (langue)' },
                    { symbol: 'ŋ', description: 'Ng nasal — comme le « ng » de « parking »', example: 'maŋgo (mangue)' },
                    { symbol: 'ƴ', description: 'Y implosif — glottale palatale unique au Fulfulde', example: 'ƴoogaade (puiser)' },
                    { symbol: 'c', description: 'Tch — se prononce toujours « tch » comme dans « tchad »', example: 'cellal (santé)' },
                    { symbol: 'nj', description: 'Nj — nasale palatale, comme « gn » en français', example: 'njamndi (fer)' }
                ]
            },
            methodology: {
                title: 'Comment créons-nous les termes scientifiques ?',
                steps: [
                    { num: 1, title: 'Recherche des racines', desc: 'Nous identifions les racines Fulfulde existantes qui se rapprochent du concept scientifique.' },
                    { num: 2, title: 'Dérivation morphologique', desc: 'Le Fulfulde possède un système de classes nominales (environ 25) qui permet de créer des dérivés logiques.' },
                    { num: 3, title: 'Validation communautaire', desc: 'Les nouveaux termes sont testés auprès de locuteurs natifs dans plusieurs pays (Sénégal, Guinée, Mali, Cameroun).' },
                    { num: 4, title: 'Publication officielle', desc: 'Le terme validé est ajouté au dictionnaire Goomu Fulo & Wiɗto et diffusé dans les supports éducatifs.' }
                ]
            }
        },
        en: {
            introduction: {
                title: 'Science in Fulfulde: A Modern Challenge',
                paragraphs: [
                    "The Fulfulde language, spoken by over 40 million people across West and Central Africa, possesses a lexical richness that is often overlooked. Scientific vocabulary in Fulfulde builds on ancient roots that describe the natural world with remarkable precision.",
                    "The Goomu Fulo & Wiɗto Academy has worked for over 10 years to create and standardize technical terms that enable teaching sciences — mathematics, physics, biology, computer science — directly in Fulfulde."
                ]
            },
            didYouKnow: [
                {
                    icon: '🧮',
                    title: 'Fulfulde Numerals',
                    text: "The Fulfulde numeral system is decimal and perfectly regular. \"Go'o\" (1), \"ɗiɗi\" (2), \"tati\" (3)… The words \"teemedere\" (100) and \"ujunere\" (1000) can express any number."
                },
                {
                    icon: '🌿',
                    title: 'Traditional Botany',
                    text: "Fulani pastoralists developed an extremely rich botanical vocabulary. For example, they distinguish over 20 types of pasture grasses by their nutritional value for cattle."
                },
                {
                    icon: '⭐',
                    title: 'Pastoral Astronomy',
                    text: "Fulani herders use the stars (koode) for navigation and seasonal prediction. \"Jaayre\" refers to the Milky Way and served as a natural calendar for transhumance."
                }
            ],
            exampleSentences: [
                {
                    ff: "Naange ina wutti, leydi ina yiiloo.",
                    en: "The sun shines, the earth rotates.",
                    context: "Astronomy — solar system description"
                },
                {
                    ff: "Lekki ki ina fusa, ɓiɓɓe mum ina caree.",
                    en: "The tree blooms, its fruits scatter.",
                    context: "Biology — plant reproduction cycle"
                },
                {
                    ff: "Limoore nder hiisa ko huunde tiiɗnde.",
                    en: "Calculation in mathematics is fundamental.",
                    context: "Mathematics — importance of calculation"
                }
            ],
            pronunciation: {
                title: 'Scientific Pronunciation Guide',
                intro: 'Scientific terms in Fulfulde follow the language\'s phonological rules. Here are the key sounds:',
                sounds: [
                    { symbol: 'ɓ', description: 'Implosive B — mouth closes then air comes in (like swallowing)', example: 'ɓiɗɗo (child)' },
                    { symbol: 'ɗ', description: 'Implosive D — tongue touches palate, air is drawn in', example: 'ɗemngal (language)' },
                    { symbol: 'ŋ', description: 'Nasal ng — like "ng" in "parking"', example: 'maŋgo (mango)' },
                    { symbol: 'ƴ', description: 'Implosive Y — palatal glottal unique to Fulfulde', example: 'ƴoogaade (to draw water)' },
                    { symbol: 'c', description: 'Ch — always pronounced "ch" as in "church"', example: 'cellal (health)' },
                    { symbol: 'nj', description: 'Nj — palatal nasal, like "ny" in "canyon"', example: 'njamndi (iron)' }
                ]
            },
            methodology: {
                title: 'How Do We Create Scientific Terms?',
                steps: [
                    { num: 1, title: 'Root Research', desc: 'We identify existing Fulfulde roots that relate to the scientific concept.' },
                    { num: 2, title: 'Morphological Derivation', desc: 'Fulfulde has a noun class system (about 25 classes) that allows creating logical derivatives.' },
                    { num: 3, title: 'Community Validation', desc: 'New terms are tested with native speakers in several countries (Senegal, Guinea, Mali, Cameroon).' },
                    { num: 4, title: 'Official Publication', desc: 'The validated term is added to the Goomu Fulo & Wiɗto dictionary and distributed in educational materials.' }
                ]
            }
        },
        ff: {
            introduction: {
                title: 'Ganndal nder Fulfulde : darnde hesere',
                paragraphs: [
                    "Fulfulde ko ɗemngal ngal yimɓe miliyoŋaaji 40 ina kaala nder Afrik hirnaange e hakkunde. Kelme ganndal nder Fulfulde ina njogii ɗaɗi kiɗɗi kollitooji aduna tagofeere e nuunɗal mawnde.",
                    "Goomu Fulo & Wiɗto ina golla gila duuɓi 10 ngam soseede e mooftude kelme ɗe eɗen mbaawi jannginde ganndal — hiisa, fisiks, baylooji, ordinateer — e nder Fulfulde ɗaɗɗiire."
                ]
            },
            didYouKnow: [
                {
                    icon: '🧮',
                    title: 'Limle Fulfulde',
                    text: "Yuɓɓo limooje Fulfulde ko desimaal e yuɓɓo moƴƴo. « Go'o » (1), « ɗiɗi » (2), « tati » (3)… « Teemedere » (100) e « ujunere » (1000) ina mbaawi limde kala limoore."
                },
                {
                    icon: '🌿',
                    title: 'Ganndal leɗɗe aadee',
                    text: "Fulɓe aynaaɓe ɓe ina njogii kelme keewɗe dow leɗɗe. Yeru, eɓe mbaawtoo leɗɗe huddo ko ɓuri 20 dow njaru ñaamdu ndaɓɓa."
                },
                {
                    icon: '⭐',
                    title: 'Ganndal koode aynaaɓe',
                    text: "Aynaaɓe Fulɓe kuutortoo koode ngam ɗowgol e anndude dumunnaaji. « Jaayre » firti daande-maayo koode, omo wallunoo e ngaynaaka."
                }
            ],
            exampleSentences: [
                {
                    ff: "Naange ina wutti, leydi ina yiiloo.",
                    fr: "Naange ina jalba, leydi ina yiiloo.",
                    context: "Ganndal koode — yuɓɓo naange"
                },
                {
                    ff: "Lekki ki ina fusa, ɓiɓɓe mum ina caree.",
                    fr: "Lekki ki fusii, ɓiɗɗi mum caraama.",
                    context: "Bayloji — nguurndam leɗɗe"
                },
                {
                    ff: "Limoore nder hiisa ko huunde tiiɗnde.",
                    fr: "Limoore nder hiisa ko huunde tiiɗnde sanne.",
                    context: "Hiisa — tiiɗgol limoore"
                }
            ],
            pronunciation: {
                title: 'Cifol ɗemɗe ganndal',
                intro: 'Kelme ganndal nder Fulfulde ina tokkii doosgal ɗemngal ngal. Ekkito ɗeeɗoo daɗe :',
                sounds: [
                    { symbol: 'ɓ', description: 'B uddittiiɗo — hunnduko uddoo, henndu naata', example: 'ɓiɗɗo (ɓiyngel)' },
                    { symbol: 'ɗ', description: 'D uddittiiɗo — ɗemngal memata daande, henndu ardata', example: 'ɗemngal (ɗemngal)' },
                    { symbol: 'ŋ', description: 'Ng kinnirɗo — wa « ng » nder « parking »', example: 'maŋgo (maŋgo)' },
                    { symbol: 'ƴ', description: 'Y uddittiiɗo — ko Fulfulde tan jogii ɗum', example: 'ƴoogaade (ƴoogaade)' },
                    { symbol: 'c', description: 'Tch — sahaa kala firata « tch »', example: 'cellal (cellal)' },
                    { symbol: 'nj', description: 'Nj — kinnirɗo wa « gn » e Farayse', example: 'njamndi (njamndi)' }
                ]
            },
            methodology: {
                title: 'Hol no min cosotoo kelme ganndal ?',
                steps: [
                    { num: 1, title: 'Ɗaɗi binndaaɗe', desc: 'Min tewta ɗaɗi Fulfulde gonɗe ɗe ɓadii miijo ganndal ngol.' },
                    { num: 2, title: 'Soseede kelme kese', desc: 'Fulfulde jogii yuɓɓo inɗe (ko ina 25 fedde) ngam soseede kelme kese loowɗe.' },
                    { num: 3, title: 'Ñaawgol renndo', desc: 'Kelme kese ɗee ina ndaɗɗee e haalpulaar\'en leyɗeele keewɗe (Senegaal, Gine, Maali, Kameruun).' },
                    { num: 4, title: 'Bayyingol kesal', desc: 'Helmere yaafaande ndee ina soketee e saggitorde Goomu Fulo & Wiɗto e caakee nder defte janngirɗe.' }
                ]
            }
        }
    },

    'societe-droit': {
        fr: {
            introduction: {
                title: 'Le droit et la société en Fulfulde',
                paragraphs: [
                    "La société Peule possède un système juridique traditionnel complexe appelé « Pulaaku » — un code moral et social qui régit les relations humaines. Ce patrimoine constitue une base solide pour exprimer les concepts juridiques modernes en Fulfulde.",
                    "La terminologie juridique et sociale permet aux citoyens Fulɓe de comprendre leurs droits et devoirs dans leur propre langue, facilitant l'accès à la justice et à la participation civique."
                ]
            },
            didYouKnow: [
                {
                    icon: '📜',
                    title: 'Le Pulaaku',
                    text: "Le Pulaaku est le code d'honneur Peul. Il repose sur quatre piliers : « Munyal » (patience), « Semteende » (pudeur), « Hakkille » (sagesse) et « Ngorgu » (courage). Ce système régulait les conflits bien avant les codes modernes."
                },
                {
                    icon: '🤝',
                    title: 'La palabre Peule',
                    text: "Chez les Peuls, les conflits étaient résolus par la « jokkondiral » — une assemblée de sages. Ce système de médiation traditionnelle inspire aujourd'hui les mécanismes de justice réparatrice."
                },
                {
                    icon: '🏛️',
                    title: 'L\'organisation politique',
                    text: "L'Empire du Macina, le Fouta-Djalon et le Fouta-Toro étaient des États Peuls dotés de constitutions, de tribunaux et de systèmes fiscaux sophistiqués, tous fonctionnant en Fulfulde."
                }
            ],
            exampleSentences: [
                {
                    ff: "Laawol ko laawol, gooto kala ina jogii hakkeeji mum.",
                    fr: "La loi est la loi, chacun a ses droits.",
                    context: "Droit — principe d'égalité devant la loi"
                },
                {
                    ff: "Ndenndaandi ko huunde yimɓe fof.",
                    fr: "La république appartient à tous.",
                    context: "Sciences politiques — souveraineté populaire"
                },
                {
                    ff: "Njulaagu moƴƴu ina haɗa baasal.",
                    fr: "Un bon commerce empêche la pauvreté.",
                    context: "Économie — importance des échanges"
                }
            ],
            pronunciation: {
                title: 'Prononciation du vocabulaire juridique',
                intro: 'Les termes juridiques utilisent souvent des consonnes prénasalisées propres au Fulfulde :',
                sounds: [
                    { symbol: 'mb', description: 'Mb prénasalisé — le son « m » précède le « b »', example: 'jammbere (hache/justice)' },
                    { symbol: 'nd', description: 'Nd prénasalisé — comme « nd » mais avec prénasalisation', example: 'ndenndaandi (république)' },
                    { symbol: 'ng', description: 'Ng prénasalisé — le « n » nasalise le « g »', example: 'ngenndi (nation)' },
                    { symbol: 'nj', description: 'Nj prénasalisé — son palatal nasalisé', example: 'njulaagu (commerce)' }
                ]
            },
            methodology: {
                title: 'Adapter le vocabulaire juridique moderne',
                steps: [
                    { num: 1, title: 'Analyse du concept', desc: 'Nous étudions le concept juridique dans son contexte universel et africain.' },
                    { num: 2, title: 'Recherche traditionnelle', desc: 'Nous cherchons dans le droit coutumier Peul un concept équivalent ou approchant.' },
                    { num: 3, title: 'Création terminologique', desc: 'Le nouveau terme est forgé en respectant la morphologie et la phonétique Fulfulde.' },
                    { num: 4, title: 'Diffusion', desc: 'Le terme est intégré dans les documents juridiques et les formations en langue Fulfulde.' }
                ]
            }
        },
        en: {
            introduction: {
                title: 'Law and Society in Fulfulde',
                paragraphs: [
                    "Fulani society has a complex traditional legal system called \"Pulaaku\" — a moral and social code governing human relations. This heritage provides a solid foundation for expressing modern legal concepts in Fulfulde.",
                    "Legal and social terminology enables Fulɓe citizens to understand their rights and duties in their own language, facilitating access to justice and civic participation."
                ]
            },
            didYouKnow: [
                {
                    icon: '📜',
                    title: 'The Pulaaku',
                    text: "Pulaaku is the Fulani code of honor. It rests on four pillars: \"Munyal\" (patience), \"Semteende\" (modesty), \"Hakkille\" (wisdom), and \"Ngorgu\" (courage). This system regulated conflicts long before modern codes."
                },
                {
                    icon: '🤝',
                    title: 'The Fulani Palaver',
                    text: "Among the Fulani, conflicts were resolved through \"jokkondiral\" — an assembly of elders. This traditional mediation system now inspires restorative justice mechanisms."
                },
                {
                    icon: '🏛️',
                    title: 'Political Organization',
                    text: "The Macina Empire, Fouta-Djallon, and Fouta-Toro were Fulani states with constitutions, courts, and sophisticated tax systems, all operating in Fulfulde."
                }
            ],
            exampleSentences: [
                {
                    ff: "Laawol ko laawol, gooto kala ina jogii hakkeeji mum.",
                    en: "The law is the law, everyone has their rights.",
                    context: "Law — principle of equality before the law"
                },
                {
                    ff: "Ndenndaandi ko huunde yimɓe fof.",
                    en: "The republic belongs to everyone.",
                    context: "Political science — popular sovereignty"
                },
                {
                    ff: "Njulaagu moƴƴu ina haɗa baasal.",
                    en: "Good trade prevents poverty.",
                    context: "Economics — importance of exchange"
                }
            ],
            pronunciation: {
                title: 'Legal Vocabulary Pronunciation',
                intro: 'Legal terms often use prenasalized consonants unique to Fulfulde:',
                sounds: [
                    { symbol: 'mb', description: 'Prenasalized mb — the "m" sound precedes the "b"', example: 'jammbere (axe/justice)' },
                    { symbol: 'nd', description: 'Prenasalized nd — "nd" with prenasalization', example: 'ndenndaandi (republic)' },
                    { symbol: 'ng', description: 'Prenasalized ng — "n" nasalizes the "g"', example: 'ngenndi (nation)' },
                    { symbol: 'nj', description: 'Prenasalized nj — nasalized palatal sound', example: 'njulaagu (commerce)' }
                ]
            },
            methodology: {
                title: 'Adapting Modern Legal Vocabulary',
                steps: [
                    { num: 1, title: 'Concept Analysis', desc: 'We study the legal concept in its universal and African context.' },
                    { num: 2, title: 'Traditional Research', desc: 'We search Fulani customary law for an equivalent or similar concept.' },
                    { num: 3, title: 'Term Creation', desc: 'The new term is forged while respecting Fulfulde morphology and phonetics.' },
                    { num: 4, title: 'Distribution', desc: 'The term is integrated into legal documents and Fulfulde language training.' }
                ]
            }
        },
        ff: {
            introduction: {
                title: 'Laawol e renndo nder Fulfulde',
                paragraphs: [
                    "Renndo Fulɓe ina jogii yuɓɓo laawol ganni biyeteengol « Pulaaku » — ko doosgal jikkuuji e ngonka renndo. Ooɗoo ngalu ko ɗaɗol moƴƴol ngam haalde miijuuji laawol keso nder Fulfulde.",
                    "Kelme laawol e renndo ina ngadda Fulɓe faamude hakkeeji mum e gollal mum'en e nder ɗemngal mum'en, ina newna keɓgol nuunɗal."
                ]
            },
            didYouKnow: [
                {
                    icon: '📜',
                    title: 'Pulaaku',
                    text: "Pulaaku ko doosgal teddeendi Fulɓe. Omo daranii : « Munyal », « Semteende », « Hakkille » e « Ngorgu ». Oo yuɓɓo ñaawta luure gila ko adii doosɗe kese."
                },
                {
                    icon: '🤝',
                    title: 'Jokkondiral Fulɓe',
                    text: "Fulɓe ñawtonoo luure e dow jokkondiral — kawtal mawɓe. Oo yuɓɓo ina hirjina hannde kuutorɗe nuunɗal moƴƴol."
                },
                {
                    icon: '🏛️',
                    title: 'Laamu Fulɓe',
                    text: "Laamuuji Maasina, Fuuta-Jaloo e Fuuta-Tooro ko laamuuji Fulɓe jogiiɗi doosɗe, ñaawirɗe e yuɓɓo lampo, fof e nder Fulfulde."
                }
            ],
            exampleSentences: [
                {
                    ff: "Laawol ko laawol, gooto kala ina jogii hakkeeji mum.",
                    fr: "Laawol ko laawol, gooto kala ina jogii hakkeeji mum.",
                    context: "Laawol — potal yeeso laawol"
                },
                {
                    ff: "Ndenndaandi ko huunde yimɓe fof.",
                    fr: "Ndenndaandi ko huunde yimɓe fof.",
                    context: "Ganndal siyaasa — laamu yimɓe"
                },
                {
                    ff: "Njulaagu moƴƴu ina haɗa baasal.",
                    fr: "Njulaagu moƴƴu ina haɗa baasal.",
                    context: "Faggudu — tiiɗgol njulaagu"
                }
            ],
            pronunciation: {
                title: 'Cifol kelme laawol',
                intro: 'Kelme laawol ina kuutoroo ɗaɗe kinnireeɗe Fulfulde :',
                sounds: [
                    { symbol: 'mb', description: 'Mb kinnirɗo — « m » arata tawo « b »', example: 'jammbere (jammbere)' },
                    { symbol: 'nd', description: 'Nd kinnirɗo — kinnirgol « nd »', example: 'ndenndaandi (ndenndaandi)' },
                    { symbol: 'ng', description: 'Ng kinnirɗo — « n » kinnirii « g »', example: 'ngenndi (ngenndi)' },
                    { symbol: 'nj', description: 'Nj kinnirɗo — daɗe kinnireeɗe', example: 'njulaagu (njulaagu)' }
                ]
            },
            methodology: {
                title: 'Newwinde kelme laawol keso',
                steps: [
                    { num: 1, title: 'Ƴeewndagol miijo', desc: 'Min ƴeewta miijo laawol ngol e dow ngonka winndereewal e Afrik.' },
                    { num: 2, title: 'Ɗaɗi ganni', desc: 'Min tewta nder laawol aada Fulɓe miijo potndiiɗo.' },
                    { num: 3, title: 'Cosgol helmere', desc: 'Helmere hesere ndee sosete dow doosgal ɗemngal Fulfulde.' },
                    { num: 4, title: 'Caakgol', desc: 'Helmere ndee soketee e binndanɗe laawol e jaŋde Fulfulde.' }
                ]
            }
        }
    },

    'sante-medecine': {
        fr: {
            introduction: {
                title: 'La santé en Fulfulde : sauver des vies par la langue',
                paragraphs: [
                    "Dans les zones rurales où le Fulfulde est la langue principale, les barrières linguistiques en milieu médical peuvent coûter des vies. Un patient qui ne comprend pas le diagnostic ou le traitement prescrit ne peut pas se soigner correctement.",
                    "La terminologie médicale en Fulfulde est un outil vital. Elle permet aux agents de santé communautaire de communiquer efficacement avec les populations, de mener des campagnes de vaccination et de sensibiliser sur les maladies."
                ]
            },
            didYouKnow: [
                {
                    icon: '🌱',
                    title: 'Médecine traditionnelle Peule',
                    text: "Les Peuls ont une pharmacopée traditionnelle riche. Le « lekki selli » (arbre qui guérit) désigne les plantes médicinales. Plus de 200 plantes sont répertoriées dans la médecine traditionnelle Peule."
                },
                {
                    icon: '🥛',
                    title: 'Le lait : aliment-médicament',
                    text: "Le lait (« kosam ») est considéré comme un aliment sacré chez les Peuls. Le lait caillé (« kaadam ») est utilisé traditionnellement comme probiotique naturel pour soigner les troubles digestifs."
                },
                {
                    icon: '🏥',
                    title: 'Santé communautaire',
                    text: "Dans certaines régions du Sahel, 70% des consultations médicales nécessitent un interprète. Former les agents de santé en terminologie Fulfulde réduit les erreurs médicales de façon significative."
                }
            ],
            exampleSentences: [
                {
                    ff: "Ɗaɗo maa ina ɓeydoo ɓuuɓol, a haanaa yahde safrirde.",
                    fr: "Ta fièvre augmente, tu dois aller au centre de santé.",
                    context: "Diagnostic — orientation du patient"
                },
                {
                    ff: "Ñaw ngaw foti safretee e leɗɗe ɗee.",
                    fr: "Cette maladie doit être traitée avec ces médicaments.",
                    context: "Traitement — prescription médicale"
                },
                {
                    ff: "Cukalel ngel foti tuugnaade ngam haɗde rafi.",
                    fr: "Cet enfant doit être vacciné pour prévenir la maladie.",
                    context: "Prévention — vaccination infantile"
                }
            ],
            pronunciation: {
                title: 'Prononciation des termes médicaux',
                intro: 'Les termes médicaux en Fulfulde utilisent des sons spécifiques. Maîtrisez ces sons pour communiquer clairement :',
                sounds: [
                    { symbol: 'ñ', description: 'Gn mouillé — comme le « gn » dans « agneau »', example: 'ñawu (maladie)' },
                    { symbol: 'ɓ', description: 'B implosif — son caractéristique des termes corporels', example: 'ɓernde (cœur)' },
                    { symbol: 'nd', description: 'Nd prénasalisé — fréquent dans les termes de santé', example: 'ndiyam (eau)' },
                    { symbol: 'cel', description: 'Cel — racine liée à la santé/guérison', example: 'cellal (santé), selde (guérir)' }
                ]
            },
            methodology: {
                title: 'Créer des termes médicaux accessibles',
                steps: [
                    { num: 1, title: 'Besoin identifié', desc: 'Les agents de santé signalent les termes manquants dans leur pratique quotidienne.' },
                    { num: 2, title: 'Consultation médicale', desc: 'Des médecins et linguistes collaborent pour définir précisément le concept médical.' },
                    { num: 3, title: 'Terme compréhensible', desc: 'Le terme créé doit être immédiatement compris par un locuteur Fulfulde sans formation médicale.' },
                    { num: 4, title: 'Diffusion terrain', desc: 'Les termes sont intégrés dans les guides de santé communautaire et les campagnes de sensibilisation.' }
                ]
            }
        },
        en: {
            introduction: {
                title: 'Health in Fulfulde: Saving Lives Through Language',
                paragraphs: [
                    "In rural areas where Fulfulde is the primary language, linguistic barriers in medical settings can cost lives. A patient who cannot understand the diagnosis or prescribed treatment cannot heal properly.",
                    "Medical terminology in Fulfulde is a vital tool. It enables community health workers to communicate effectively, conduct vaccination campaigns, and raise awareness about diseases."
                ]
            },
            didYouKnow: [
                {
                    icon: '🌱',
                    title: 'Traditional Fulani Medicine',
                    text: "The Fulani have a rich traditional pharmacopoeia. \"Lekki selli\" (healing tree) refers to medicinal plants. Over 200 plants are documented in traditional Fulani medicine."
                },
                {
                    icon: '🥛',
                    title: 'Milk: Food as Medicine',
                    text: "Milk (\"kosam\") is considered sacred among the Fulani. Curdled milk (\"kaadam\") is traditionally used as a natural probiotic to treat digestive problems."
                },
                {
                    icon: '🏥',
                    title: 'Community Health',
                    text: "In some Sahel regions, 70% of medical consultations require an interpreter. Training health workers in Fulfulde terminology significantly reduces medical errors."
                }
            ],
            exampleSentences: [
                {
                    ff: "Ɗaɗo maa ina ɓeydoo ɓuuɓol, a haanaa yahde safrirde.",
                    en: "Your fever is rising, you need to go to the health center.",
                    context: "Diagnosis — patient referral"
                },
                {
                    ff: "Ñaw ngaw foti safretee e leɗɗe ɗee.",
                    en: "This disease must be treated with these medicines.",
                    context: "Treatment — medical prescription"
                },
                {
                    ff: "Cukalel ngel foti tuugnaade ngam haɗde rafi.",
                    en: "This child must be vaccinated to prevent disease.",
                    context: "Prevention — child vaccination"
                }
            ],
            pronunciation: {
                title: 'Medical Term Pronunciation',
                intro: 'Medical terms in Fulfulde use specific sounds. Master these to communicate clearly:',
                sounds: [
                    { symbol: 'ñ', description: 'Palatalized n — like "ny" in "canyon"', example: 'ñawu (disease)' },
                    { symbol: 'ɓ', description: 'Implosive B — characteristic of body-related terms', example: 'ɓernde (heart)' },
                    { symbol: 'nd', description: 'Prenasalized nd — frequent in health terms', example: 'ndiyam (water)' },
                    { symbol: 'cel', description: 'Cel — root related to health/healing', example: 'cellal (health), selde (to heal)' }
                ]
            },
            methodology: {
                title: 'Creating Accessible Medical Terms',
                steps: [
                    { num: 1, title: 'Need Identified', desc: 'Health workers report missing terms in their daily practice.' },
                    { num: 2, title: 'Medical Consultation', desc: 'Doctors and linguists collaborate to precisely define the medical concept.' },
                    { num: 3, title: 'Understandable Term', desc: 'The created term must be immediately understood by a Fulfulde speaker without medical training.' },
                    { num: 4, title: 'Field Distribution', desc: 'Terms are integrated into community health guides and awareness campaigns.' }
                ]
            }
        },
        ff: {
            introduction: {
                title: 'Cellal nder Fulfulde : daɗɗude nguurndam e ɗemngal',
                paragraphs: [
                    "Nder nokkuuji ladde ɗo Fulfulde woni ɗemngal gadanal, caɗeele ɗemngal nder safrirɗe ina mbaawi warde. Ñawɗo mo faamaani ko safroowo wi'i oo waawaa sellinde.",
                    "Kelme cellal nder Fulfulde ko kuutorgal nguurndam. Ina newna gollotooɓe cellal renndo yottineede e yimɓe, waɗde geɗe tuugnaade e anndinde ñawuuji."
                ]
            },
            didYouKnow: [
                {
                    icon: '🌱',
                    title: 'Safaara Fulɓe',
                    text: "Fulɓe ina njogii ganndal leɗɗe safaara keewngal. « Lekki selli » ko leɗɗe cafrirɗe. Ko ɓuri 200 lekki ina mooftaa nder safaara ganni Fulɓe."
                },
                {
                    icon: '🥛',
                    title: 'Kosam : ñaamdu-safaara',
                    text: "Kosam ko ñaamdu teddundu to Fulɓe. Kaadam kuutoree wa safaara tagofeere ngam safrude reedu."
                },
                {
                    icon: '🏥',
                    title: 'Cellal renndo',
                    text: "Nder nokkuuji Sahel, 70% nder safrirɗe ina kaɓɓi e firtinoowo. Jaŋde kelme Fulfulde cellal ina ustoo juume safrirɗe."
                }
            ],
            exampleSentences: [
                {
                    ff: "Ɗaɗo maa ina ɓeydoo ɓuuɓol, a haanaa yahde safrirde.",
                    fr: "Ɗaɗo maa ina ɓeydoo, yahu safrirde.",
                    context: "Ñawndal — neldude ñawɗo"
                },
                {
                    ff: "Ñaw ngaw foti safretee e leɗɗe ɗee.",
                    fr: "Ñaw ngaw foti safretee e leɗɗe ɗee.",
                    context: "Safrude — yamiroore safaara"
                },
                {
                    ff: "Cukalel ngel foti tuugnaade ngam haɗde rafi.",
                    fr: "Cukalel ngel foti tuugnaade.",
                    context: "Reentaade — tuugnaade cukalel"
                }
            ],
            pronunciation: {
                title: 'Cifol kelme cellal',
                intro: 'Kelme cellal nder Fulfulde ina kuutoroo daɗe keeriɗe. Ekkito ɗee daɗe :',
                sounds: [
                    { symbol: 'ñ', description: 'Gn — wa « gn » nder Farayse', example: 'ñawu (ñawu)' },
                    { symbol: 'ɓ', description: 'B uddittiiɗo — daɗol ɓanndu', example: 'ɓernde (ɓernde)' },
                    { symbol: 'nd', description: 'Nd kinnirɗo — keewɗo nder cellal', example: 'ndiyam (ndiyam)' },
                    { symbol: 'cel', description: 'Cel — ɗaɗol cellal/safrude', example: 'cellal (cellal), selde (selde)' }
                ]
            },
            methodology: {
                title: 'Soseede kelme cellal paamotooɗe',
                steps: [
                    { num: 1, title: 'Sokla annditaama', desc: 'Golloɓe cellal njiɗa kelme ɗe aldaa nder golle mum\'en.' },
                    { num: 2, title: 'Jokkondiral safrooɓe', desc: 'Safrooɓe e ɗemɗiyaŋkooɓe ngollondiri ngam faamnude miijo safaara ngoo.' },
                    { num: 3, title: 'Helmere paamoteende', desc: 'Helmere sosaaɗe ndee foti faamnaade Pullo mo jannginaaka safaara.' },
                    { num: 4, title: 'Caakgol nokku', desc: 'Kelme ɗee cokketee nder defte cellal renndo e geɗe anndinde.' }
                ]
            }
        }
    },

    'education': {
        fr: {
            introduction: {
                title: "L'éducation en Fulfulde : enseigner dans sa langue maternelle",
                paragraphs: [
                    "L'UNESCO recommande l'enseignement dans la langue maternelle pendant les premières années d'école. Pour les enfants Fulɓe, apprendre les bases en Fulfulde améliore considérablement la compréhension et la rétention des connaissances.",
                    "Ce domaine couvre le vocabulaire pédagogique, les termes agricoles, pastoraux et artisanaux — des savoirs pratiques essentiels qui peuvent être enseignés dès l'école primaire en Fulfulde."
                ]
            },
            didYouKnow: [
                {
                    icon: '📖',
                    title: "L'alphabet Fulfulde",
                    text: "Le Fulfulde utilise l'alphabet latin enrichi de caractères spéciaux : ɓ, ɗ, ŋ, ñ, ƴ. Il s'écrit historiquement aussi en Ajami (alphabet arabe adapté). Certaines communautés utilisent l'Adlam, un alphabet créé en 1989 par deux frères guinéens."
                },
                {
                    icon: '🐄',
                    title: "Le vocabulaire pastoral",
                    text: "Les Peuls distinguent plus de 100 termes pour décrire la robe d'une vache selon sa couleur, ses motifs et ses taches. Ce vocabulaire pastoral est l'un des plus riches au monde."
                },
                {
                    icon: '🎵',
                    title: "Apprendre par le chant",
                    text: "Traditionnellement, les enfants Peuls apprennent par les « jimol » (chants éducatifs). Les bergers chantent des poèmes (« gine ») qui enseignent les noms des plantes, des étoiles et des saisons."
                }
            ],
            exampleSentences: [
                {
                    ff: "Jaŋde ko fittaandu nguurndam.",
                    fr: "L'éducation est la clé de la vie.",
                    context: "Éducation — valeur de l'apprentissage"
                },
                {
                    ff: "Nagge am ina haɗi, mi yilloyii nge safrirde.",
                    fr: "Ma vache est malade, je l'emmène au vétérinaire.",
                    context: "Élevage — soins vétérinaires"
                },
                {
                    ff: "Gese amen ina ɓenndi, toɓo arani.",
                    fr: "Nos champs sont prêts, la pluie est venue.",
                    context: "Agriculture — cycle des cultures"
                }
            ],
            pronunciation: {
                title: 'Les sons de la salle de classe',
                intro: "Pour enseigner en Fulfulde, il faut maîtriser les voyelles longues et courtes qui changent le sens des mots :",
                sounds: [
                    { symbol: 'a / aa', description: 'Voyelle courte vs longue — le sens change', example: 'wara (venir/tuer) vs waara (ruisseau)' },
                    { symbol: 'e / ee', description: 'E court vs long — distinction fondamentale', example: 'rede (ventre) vs reede (être enceinte)' },
                    { symbol: 'u / uu', description: 'U court vs long', example: 'wuro (village) vs wuuro (village peul spécifique)' },
                    { symbol: 'o / oo', description: 'O court vs long', example: 'hoore (tête) vs hore (récolter)' }
                ]
            },
            methodology: {
                title: "Comment nous développons les termes éducatifs",
                steps: [
                    { num: 1, title: 'Besoins du terrain', desc: "Les enseignants des écoles bilingues identifient les lacunes terminologiques dans leurs cours." },
                    { num: 2, title: 'Savoirs locaux', desc: "Nous intégrons les connaissances des éleveurs, agriculteurs et artisans dans le vocabulaire éducatif." },
                    { num: 3, title: "Test en classe", desc: "Les nouveaux termes sont testés dans des classes pilotes pour vérifier qu'ils sont compris par les élèves." },
                    { num: 4, title: 'Manuels scolaires', desc: "Les termes validés sont intégrés dans les manuels scolaires et les supports pédagogiques en Fulfulde." }
                ]
            }
        },
        en: {
            introduction: {
                title: 'Education in Fulfulde: Teaching in the Mother Tongue',
                paragraphs: [
                    "UNESCO recommends education in the mother tongue during the first years of school. For Fulɓe children, learning basics in Fulfulde significantly improves comprehension and knowledge retention.",
                    "This domain covers pedagogical vocabulary, agricultural, pastoral, and artisanal terms — essential practical knowledge that can be taught from primary school in Fulfulde."
                ]
            },
            didYouKnow: [
                {
                    icon: '📖',
                    title: 'The Fulfulde Alphabet',
                    text: "Fulfulde uses the Latin alphabet enriched with special characters: ɓ, ɗ, ŋ, ñ, ƴ. It was historically also written in Ajami (adapted Arabic script). Some communities use Adlam, an alphabet created in 1989 by two Guinean brothers."
                },
                {
                    icon: '🐄',
                    title: 'Pastoral Vocabulary',
                    text: "The Fulani distinguish over 100 terms to describe a cow's coat by its color, patterns, and spots. This pastoral vocabulary is one of the richest in the world."
                },
                {
                    icon: '🎵',
                    title: 'Learning Through Song',
                    text: "Traditionally, Fulani children learn through \"jimol\" (educational songs). Herders sing poems (\"gine\") that teach the names of plants, stars, and seasons."
                }
            ],
            exampleSentences: [
                {
                    ff: "Jaŋde ko fittaandu nguurndam.",
                    en: "Education is the key to life.",
                    context: "Education — value of learning"
                },
                {
                    ff: "Nagge am ina haɗi, mi yilloyii nge safrirde.",
                    en: "My cow is sick, I'm taking it to the vet.",
                    context: "Animal husbandry — veterinary care"
                },
                {
                    ff: "Gese amen ina ɓenndi, toɓo arani.",
                    en: "Our fields are ready, the rain has come.",
                    context: "Agriculture — crop cycles"
                }
            ],
            pronunciation: {
                title: 'Classroom Sounds',
                intro: 'To teach in Fulfulde, you must master long and short vowels that change word meaning:',
                sounds: [
                    { symbol: 'a / aa', description: 'Short vs long vowel — meaning changes', example: 'wara (to come/kill) vs waara (stream)' },
                    { symbol: 'e / ee', description: 'Short vs long E — fundamental distinction', example: 'rede (belly) vs reede (to be pregnant)' },
                    { symbol: 'u / uu', description: 'Short vs long U', example: 'wuro (village) vs wuuro (specific Fulani village)' },
                    { symbol: 'o / oo', description: 'Short vs long O', example: 'hoore (head) vs hore (to harvest)' }
                ]
            },
            methodology: {
                title: 'How We Develop Educational Terms',
                steps: [
                    { num: 1, title: 'Field Needs', desc: 'Bilingual school teachers identify terminology gaps in their lessons.' },
                    { num: 2, title: 'Local Knowledge', desc: 'We integrate the knowledge of herders, farmers, and artisans into educational vocabulary.' },
                    { num: 3, title: 'Classroom Testing', desc: 'New terms are tested in pilot classes to verify students understand them.' },
                    { num: 4, title: 'Textbooks', desc: 'Validated terms are integrated into textbooks and Fulfulde teaching materials.' }
                ]
            }
        },
        ff: {
            introduction: {
                title: 'Jaŋde nder Fulfulde : jannginol e ɗemngal yumma',
                paragraphs: [
                    "UNESCO ina wasiya jaŋde e ɗemngal yumma duuɓi gadani jaŋde. Sukaaɓe Fulɓe janngude ɗaɗi nder Fulfulde ina moƴƴina faamaamuya e mooftude ganndal sanne.",
                    "Oo feccere ina moofti kelme jaŋde, kelme ndema, ngaynaaka e cuɓɗi — ganndal golle tiiɗngal baawngal janngineede gila jaŋde leslesre nder Fulfulde."
                ]
            },
            didYouKnow: [
                {
                    icon: '📖',
                    title: 'Alkule Fulfulde',
                    text: "Fulfulde ina kuutoroo alkule Latin ɓeydaaɗe ɗaaɗe keeriɗe : ɓ, ɗ, ŋ, ñ, ƴ. Omo winndanoo kadi e Ajami. Yoga renndo ina kuutoroo Adlam, alkule cosaaɗe 1989."
                },
                {
                    icon: '🐄',
                    title: 'Kelme Nagge',
                    text: "Fulɓe ina ndaan ko ɓuri 100 helmere ngam sifaade saayaare nagge dow noore mum, taƴe mum e toɓɓe mum. Ko gootal kelme ɓurɗe heewde aduna oo."
                },
                {
                    icon: '🎵',
                    title: 'Janngirgol jimol',
                    text: "E aada, sukaaɓe Fulɓe ina njanngo e « jimol ». Aynaaɓe njima « gine » janngintooɗe inɗe leɗɗe, koode e dumunnaaji."
                }
            ],
            exampleSentences: [
                {
                    ff: "Jaŋde ko fittaandu nguurndam.",
                    fr: "Jaŋde ko fittaandu nguurndam.",
                    context: "Jaŋde — tiiɗgol janngirgol"
                },
                {
                    ff: "Nagge am ina haɗi, mi yilloyii nge safrirde.",
                    fr: "Nagge am sellaani, mi nawii nge safrirde.",
                    context: "Ngaynaaka — safaara jawdi"
                },
                {
                    ff: "Gese amen ina ɓenndi, toɓo arani.",
                    fr: "Gese amin ɓenndi, toɓo arani.",
                    context: "Ndema — ngal sato gese"
                }
            ],
            pronunciation: {
                title: 'Daɗe jaŋdirde',
                intro: 'Ngam jannginol nder Fulfulde, ekkito pinal muuyooji juutɗi e daɓɓi baylotooɗi maana :',
                sounds: [
                    { symbol: 'a / aa', description: 'Muuyol daɓɓol vs juutngol — maana ina wayloo', example: 'wara (aral) vs waara (maayo)' },
                    { symbol: 'e / ee', description: 'E daɓɓol vs juutngol', example: 'rede (reedu) vs reede (reede)' },
                    { symbol: 'u / uu', description: 'U daɓɓol vs juutngol', example: 'wuro (wuro) vs wuuro (wuuro)' },
                    { symbol: 'o / oo', description: 'O daɓɓol vs juutngol', example: 'hoore (hoore) vs hore (ɗeɓde)' }
                ]
            },
            methodology: {
                title: 'Hol no min mballiti kelme jaŋde',
                steps: [
                    { num: 1, title: 'Soklaaji nokku', desc: 'Jannginooɓe janngirɗe ɗiɗi ɗemɗe ina tawta kelme ɗe ngaldaa nder derse mum\'en.' },
                    { num: 2, title: 'Ganndal hoɗɓe', desc: 'Min njowta ganndal aynaaɓe, remooɓe e cuɓɗiyaŋkooɓe nder kelme jaŋde.' },
                    { num: 3, title: 'Ƴeewndagol jaŋdirde', desc: 'Kelme kese ina ndaɗɗee nder jaŋdirɗe yiilotooɗi ngam ñaagaade sukaaɓe faamii.' },
                    { num: 4, title: 'Defte jaŋde', desc: 'Kelme yaafaaɗe ɗee cokketee nder defte jaŋde e kuutorɗe jaŋde Fulfulde.' }
                ]
            }
        }
    }
}

export default domainContent

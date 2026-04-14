const scholars = [
    {
        id: 'usman-dan-fodio',
        name: 'Usman ɗan Fodio',
        years: '1754 – 1817',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Usman_dan_Fodio.jpg/400px-Usman_dan_Fodio.jpg',
        bio: {
            fr: "Érudit, théologien et réformateur peul, fondateur du Califat de Sokoto (Nigeria actuel) en 1804. Auteur de plus de 100 ouvrages en arabe, fulfulde et haoussa sur la théologie, l'éducation et la gouvernance. Figure majeure du renouveau islamique en Afrique de l'Ouest.",
            en: "Fulani scholar, theologian and reformer, founder of the Sokoto Caliphate (modern Nigeria) in 1804. Author of more than 100 works in Arabic, Fulfulde and Hausa on theology, education and governance. A major figure of Islamic renewal in West Africa.",
            ff: "Ganndo, ceerno e mawɗo dingiral Fulɓe, taƴoowo Califaa Sokoto (Nijeriya hannde) e hitaande 1804. O winndi ko ɓuri 100 deftere e Aarabu, Fulfulde e Hawsa baɗtinɗe e diina, jaŋde e laamu. Ko o teddungal mawngal e ɓamtaade Lislaam to Afirik Hirnaange."
        }
    },
    {
        id: 'el-hadj-omar-tall',
        name: 'El Hadj Omar Tall',
        years: '1797 – 1864',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/El_hadj_oumar_tall_portrait.jpg/400px-El_hadj_oumar_tall_portrait.jpg',
        bio: {
            fr: "Savant toucouleur, théologien soufi de la Tijaniyya et fondateur de l'Empire toucouleur (1848-1893). Né à Halwar (Sénégal), il étudie à La Mecque et à Médine avant de devenir Khalife de la Tijaniyya pour l'Afrique noire. Auteur du célèbre traité Rimah al-Hizb al-Rahim.",
            en: "Toucouleur scholar, Sufi theologian of the Tijaniyya and founder of the Toucouleur Empire (1848-1893). Born in Halwar (Senegal), he studied in Mecca and Medina before becoming Caliph of the Tijaniyya for Black Africa. Author of the famous treatise Rimah al-Hizb al-Rahim.",
            ff: "Ganndo Tukuloor, ceerno Tasawuf Tijaaniyya e taƴoowo Laamu Tukuloor (1848-1893). O jibinaa to Halwaar (Senegaal), o jaŋngi to Makka e Madiina hade mum waɗde Khaliifaa Tijaaniyya nokku Afirik Ɓaleeri. O winndi deftere yiintinaande Rimah al-Hizb al-Rahim."
        }
    },
    {
        id: 'amadou-hampate-ba',
        name: 'Amadou Hampâté Bâ',
        years: '1901 – 1991',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Amadou_Hamp%C3%A2t%C3%A9_B%C3%A2.jpg/400px-Amadou_Hamp%C3%A2t%C3%A9_B%C3%A2.jpg',
        bio: {
            fr: "Écrivain, ethnologue et historien malien, considéré comme l'un des plus grands défenseurs de la tradition orale africaine. Auteur de la célèbre phrase « En Afrique, un vieillard qui meurt est une bibliothèque qui brûle ». Ses œuvres comme Amkoullel l'enfant peul ont fait connaître la culture peule au monde entier.",
            en: "Malian writer, ethnologist and historian, considered one of the greatest defenders of African oral tradition. Author of the famous quote 'In Africa, when an old man dies, a library burns to the ground'. His works such as Amkoullel l'enfant peul brought Fulani culture to worldwide attention.",
            ff: "Binndoowo, ƴeewoowo aada e jaŋnoowo daartol Maali, jeyaaɗo e ɓurɓe mawnude reentinooɓe aada haalanteejo Afirik. O wowli konngol yiintinaangol: « E Afirik, nayeejo maayɗo ko karambol sumɗo ». Defte makko hono Amkoullel ɓii Fulɓe addani winndere ndee anndude pinal Fulɓe."
        }
    },
    {
        id: 'cheikhou-amadou',
        name: 'Cheikhou Amadou',
        years: '1775 – 1845',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Sekou_Amadou.jpg/400px-Sekou_Amadou.jpg',
        bio: {
            fr: "Théologien, juriste et fondateur de l'Empire peul du Macina (1818-1862) au Mali actuel. Il instaura un État islamique fondé sur la justice sociale, l'éducation et le respect des droits des bergers et des cultivateurs. Sa capitale Hamdallaye fut un centre intellectuel majeur d'Afrique de l'Ouest.",
            en: "Theologian, jurist and founder of the Massina Fulani Empire (1818-1862) in present-day Mali. He established an Islamic state based on social justice, education and respect for the rights of herders and farmers. His capital Hamdallahi was a major intellectual center of West Africa.",
            ff: "Ceerno, kiitoowo e taƴoowo Laamu Fulɓe Maasina (1818-1862) to Maali hannde. O sinci laamu Lislaam tiiɗnortonoongu e nuunɗal, jaŋde e teddinde haqqeeji aynaaɓe e remooɓe. Caaktirde mum Hamdalaay laatii koɗorde nokkere mawnde anndal e Afirik Hirnaange."
        }
    },
    {
        id: 'tierno-bokar',
        name: 'Tierno Bokar Salif Tall',
        years: '1875 – 1939',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Tierno_Bokar.jpg/400px-Tierno_Bokar.jpg',
        bio: {
            fr: "Maître spirituel et sage soufi peul de Bandiagara (Mali), surnommé « le sage de Bandiagara ». Disciple de la confrérie Tijaniyya, il prêcha la tolérance, l'amour universel et le dialogue interreligieux. Son enseignement fut transmis au monde par son disciple Amadou Hampâté Bâ.",
            en: "Spiritual master and Fulani Sufi sage of Bandiagara (Mali), known as 'the sage of Bandiagara'. A disciple of the Tijaniyya brotherhood, he preached tolerance, universal love and interreligious dialogue. His teachings were transmitted to the world by his disciple Amadou Hampâté Bâ.",
            ff: "Ceerno e nayeejo gandoowo Sufi mo Banndiyaagara (Maali), inniraaɗo « gandoowo Banndiyaagara ». Jokkuɗo Tariiqa Tijaaniyya, o waaji muñal, giɗli winndere e haaldigal hakkunde diineeji. Jaŋde makko addanaa winndere ndee ko jokkudo makko Amadou Hampâté Bâ."
        }
    },
    {
        id: 'modibo-adama',
        name: 'Modibo Adama',
        years: '1786 – 1847',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Modibo_Adama.jpg/400px-Modibo_Adama.jpg',
        bio: {
            fr: "Érudit et chef religieux peul, fondateur de l'Émirat d'Adamaoua (1809) qui s'étendait sur le nord du Cameroun et du Nigeria actuels. Disciple d'Usman dan Fodio, il consacra sa vie à l'éducation islamique et à l'unification des populations peules de la région.",
            en: "Fulani scholar and religious leader, founder of the Adamawa Emirate (1809) which extended over present-day northern Cameroon and Nigeria. A disciple of Usman dan Fodio, he devoted his life to Islamic education and to unifying the Fulani populations of the region.",
            ff: "Ganndo e jagga diina Fulɓe, taƴoowo Almaamiyaa Adamaawa (1809) ndu yaaji haa nokku rewo Kameruun e Nijeriya hannde. Jokkudo Usman ɗan Fodio, o waɗtidi ngurndam mum e jaŋde Lislaam e ɓattindirde Fulɓe nokku oo."
        }
    }
]

export default scholars

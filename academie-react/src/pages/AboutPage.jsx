import { useTranslation } from 'react-i18next'
import './AboutPage.css'

function AboutPage() {
    const { t, i18n } = useTranslation()

    const content = {
        fr: {
            title: 'À propos de',
            highlight: 'GoomuFuloWiɗto',
            intro: 'GoomuFuloWiɗto est une organisation dédiée à la préservation, la promotion et le développement de la langue Pulaar.',
            missionTitle: 'Notre Mission',
            mission: 'Notre mission est de créer un dictionnaire complet de la langue Pulaar, de promouvoir son utilisation dans l\'éducation et les médias, et de préserver le patrimoine culturel des Fulɓe à travers leur langue.',
            historyTitle: 'Notre Histoire',
            history: 'Fondée par un groupe de linguistes, écrivains et défenseurs de la culture Pulaar, GoomuFuloWiɗto a vu le jour pour répondre au besoin urgent de documenter et standardiser le Pulaar à l\'ère numérique.',
            valuesTitle: 'Nos Valeurs',
            values: [
                { title: 'Préservation', desc: 'Protéger et documenter le patrimoine linguistique Pulaar' },
                { title: 'Éducation', desc: 'Promouvoir l\'enseignement du Pulaar dans les écoles' },
                { title: 'Innovation', desc: 'Utiliser la technologie pour la diffusion de la langue' },
                { title: 'Unité', desc: 'Rassembler les locuteurs Pulaar du monde entier' }
            ]
        },
        en: {
            title: 'About',
            highlight: 'GoomuFuloWiɗto',
            intro: 'GoomuFuloWiɗto is an organization dedicated to the preservation, promotion and development of the Pulaar language.',
            missionTitle: 'Our Mission',
            mission: 'Our mission is to create a comprehensive dictionary of the Pulaar language, promote its use in education and media, and preserve the cultural heritage of the Fulɓe through their language.',
            historyTitle: 'Our History',
            history: 'Founded by a group of linguists, writers and advocates of Pulaar culture, GoomuFuloWiɗto was created to address the urgent need to document and standardize Pulaar in the digital age.',
            valuesTitle: 'Our Values',
            values: [
                { title: 'Preservation', desc: 'Protect and document Pulaar linguistic heritage' },
                { title: 'Education', desc: 'Promote Pulaar teaching in schools' },
                { title: 'Innovation', desc: 'Use technology for language dissemination' },
                { title: 'Unity', desc: 'Bring together Pulaar speakers from around the world' }
            ]
        },
        ff: {
            title: 'Baɗte',
            highlight: 'GoomuFuloWiɗto',
            intro: 'GoomuFuloWiɗto ko fedde toppitiiɗo reentaade, ɓamtaade e ƴellitaade ɗemngal Pulaar.',
            missionTitle: 'Golle Amen',
            mission: 'Golle amen ko mahde saggitorde timmuɗo ɗemngal Pulaar, ɓamtude huutoraade mum e jaŋde e jaayndeeli, e reentaade pinal Fulɓe e ɗemngal maɓɓe.',
            historyTitle: 'Taariik Amen',
            history: 'Sosaa e dental ganndooji ɗemngal, winnderɓe e yarlitanɓe pinal Pulaar, GoomuFuloWiɗto fuɗɗii ngam jaɓɓaade waɗɗagol binndude e darnaade Pulaar e waktu internet.',
            valuesTitle: 'Jojjanɗe Amen',
            values: [
                { title: 'Reentaade', desc: 'Reentude e binndude ndonu ɗemngal Pulaar' },
                { title: 'Jaŋde', desc: 'Ɓamtude janngude Pulaar e duɗe' },
                { title: 'Kese', desc: 'Huutoraade karallaaji ngam saakde ɗemngal' },
                { title: 'Kawral', desc: 'Renndinde haaltooɓe Pulaar aduna fof' }
            ]
        }
    }

    const c = content[i18n.language] || content.fr

    return (
        <div className="about-page">
            <div className="about-page-header">
                <div className="container">
                    <h1 className="page-title">
                        {c.title} <span className="gold-accent">{c.highlight}</span>
                    </h1>
                    <p className="page-subtitle">{c.intro}</p>
                </div>
            </div>

            <div className="container">
                <section className="about-section">
                    <h2>{c.missionTitle}</h2>
                    <p>{c.mission}</p>
                </section>

                <section className="about-section">
                    <h2>{c.historyTitle}</h2>
                    <p>{c.history}</p>
                </section>

                <section className="about-section values-section">
                    <h2>{c.valuesTitle}</h2>
                    <div className="values-grid">
                        {c.values.map((value, index) => (
                            <div key={index} className="value-card">
                                <div className="value-icon">
                                    {index === 0 && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    )}
                                    {index === 1 && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                        </svg>
                                    )}
                                    {index === 2 && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    )}
                                    {index === 3 && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    )}
                                </div>
                                <h3>{value.title}</h3>
                                <p>{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default AboutPage

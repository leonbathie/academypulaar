import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './LegalPage.css'

function MentionsLegalesPage() {
    const { t } = useTranslation()

    return (
        <div className="legal-page">
            <div className="legal-page-header">
                <div className="container">
                    <h1 className="page-title">{t('legal.title')}</h1>
                    <p className="page-subtitle">{t('legal.subtitle')}</p>
                    <span className="legal-last-update">{t('legal.lastUpdate')}: 19 mars 2026</span>
                </div>
            </div>

            <div className="container">
                <div className="legal-content">
                    <nav className="legal-toc">
                        <h3>{t('legal.tocTitle')}</h3>
                        <ol>
                            <li><a href="#editeur">{t('legal.s1.title')}</a></li>
                            <li><a href="#hebergement">{t('legal.s2.title')}</a></li>
                            <li><a href="#propriete">{t('legal.s3.title')}</a></li>
                            <li><a href="#conditions">{t('legal.s4.title')}</a></li>
                            <li><a href="#responsabilite">{t('legal.s5.title')}</a></li>
                            <li><a href="#contributions">{t('legal.s6.title')}</a></li>
                            <li><a href="#liens">{t('legal.s7.title')}</a></li>
                            <li><a href="#cookies">{t('legal.s8.title')}</a></li>
                            <li><a href="#applicable">{t('legal.s9.title')}</a></li>
                            <li><a href="#contact">{t('legal.s10.title')}</a></li>
                        </ol>
                    </nav>

                    <section className="legal-section" id="editeur">
                        <h2><span className="section-number">1</span> {t('legal.s1.title')}</h2>
                        <p>{t('legal.s1.p1')}</p>
                        <ul>
                            <li><strong>{t('legal.s1.name')}:</strong> Goomu Fulo Wi\u0257to</li>
                            <li><strong>{t('legal.s1.nature')}:</strong> {t('legal.s1.natureVal')}</li>
                            <li><strong>{t('legal.s1.purpose')}:</strong> {t('legal.s1.purposeVal')}</li>
                            <li><strong>{t('legal.s1.director')}:</strong> {t('legal.s1.directorVal')}</li>
                            <li><strong>{t('legal.s1.address')}:</strong> Dakar, S\u00e9n\u00e9gal</li>
                            <li><strong>{t('legal.s1.email')}:</strong> contact@goomufulowidto.org</li>
                            <li><strong>{t('legal.s1.site')}:</strong> https://goomufulo.com</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="hebergement">
                        <h2><span className="section-number">2</span> {t('legal.s2.title')}</h2>
                        <p>{t('legal.s2.p1')}</p>
                        <ul>
                            <li><strong>{t('legal.s2.provider')}:</strong> Contabo GmbH</li>
                            <li><strong>{t('legal.s2.address')}:</strong> Aschauer Stra\u00dfe 32a, 81549 Munich, Allemagne</li>
                            <li><strong>{t('legal.s2.site')}:</strong> https://contabo.com</li>
                        </ul>
                        <p>{t('legal.s2.p2')}</p>
                    </section>

                    <section className="legal-section" id="propriete">
                        <h2><span className="section-number">3</span> {t('legal.s3.title')}</h2>
                        <p>{t('legal.s3.p1')}</p>
                        <p>{t('legal.s3.p2')}</p>
                        <div className="legal-highlight">
                            <p>{t('legal.s3.highlight')}</p>
                        </div>
                        <h3>{t('legal.s3.sub1')}</h3>
                        <p>{t('legal.s3.sub1p')}</p>
                        <ul>
                            <li>{t('legal.s3.sub1l1')}</li>
                            <li>{t('legal.s3.sub1l2')}</li>
                            <li>{t('legal.s3.sub1l3')}</li>
                            <li>{t('legal.s3.sub1l4')}</li>
                        </ul>
                        <h3>{t('legal.s3.sub2')}</h3>
                        <p>{t('legal.s3.sub2p')}</p>
                    </section>

                    <section className="legal-section" id="conditions">
                        <h2><span className="section-number">4</span> {t('legal.s4.title')}</h2>
                        <p>{t('legal.s4.p1')}</p>
                        <p>{t('legal.s4.p2')}</p>
                        <h3>{t('legal.s4.sub1')}</h3>
                        <ul>
                            <li>{t('legal.s4.sub1l1')}</li>
                            <li>{t('legal.s4.sub1l2')}</li>
                            <li>{t('legal.s4.sub1l3')}</li>
                            <li>{t('legal.s4.sub1l4')}</li>
                        </ul>
                        <h3>{t('legal.s4.sub2')}</h3>
                        <p>{t('legal.s4.sub2p')}</p>
                        <ul>
                            <li>{t('legal.s4.sub2l1')}</li>
                            <li>{t('legal.s4.sub2l2')}</li>
                            <li>{t('legal.s4.sub2l3')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="responsabilite">
                        <h2><span className="section-number">5</span> {t('legal.s5.title')}</h2>
                        <p>{t('legal.s5.p1')}</p>
                        <p>{t('legal.s5.p2')}</p>
                        <p>{t('legal.s5.p3')}</p>
                    </section>

                    <section className="legal-section" id="contributions">
                        <h2><span className="section-number">6</span> {t('legal.s6.title')}</h2>
                        <p>{t('legal.s6.p1')}</p>
                        <p>{t('legal.s6.p2')}</p>
                        <ul>
                            <li>{t('legal.s6.l1')}</li>
                            <li>{t('legal.s6.l2')}</li>
                            <li>{t('legal.s6.l3')}</li>
                            <li>{t('legal.s6.l4')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="liens">
                        <h2><span className="section-number">7</span> {t('legal.s7.title')}</h2>
                        <p>{t('legal.s7.p1')}</p>
                        <p>{t('legal.s7.p2')}</p>
                    </section>

                    <section className="legal-section" id="cookies">
                        <h2><span className="section-number">8</span> {t('legal.s8.title')}</h2>
                        <p>{t('legal.s8.p1')}</p>
                        <h3>{t('legal.s8.sub1')}</h3>
                        <ul>
                            <li>{t('legal.s8.sub1l1')}</li>
                            <li>{t('legal.s8.sub1l2')}</li>
                        </ul>
                        <p>{t('legal.s8.p2')}</p>
                    </section>

                    <section className="legal-section" id="applicable">
                        <h2><span className="section-number">9</span> {t('legal.s9.title')}</h2>
                        <p>{t('legal.s9.p1')}</p>
                        <p>{t('legal.s9.p2')}</p>
                    </section>

                    <section className="legal-section" id="contact">
                        <h2><span className="section-number">10</span> {t('legal.s10.title')}</h2>
                        <p>{t('legal.s10.p1')}</p>
                    </section>

                    <div className="legal-contact-box">
                        <h3>{t('legal.contactBox.title')}</h3>
                        <p>{t('legal.contactBox.text')}</p>
                        <p>
                            <a href="mailto:contact@goomufulowidto.org">contact@goomufulowidto.org</a>
                            {' '} | {' '}
                            <Link to="/contact">{t('legal.contactBox.form')}</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MentionsLegalesPage

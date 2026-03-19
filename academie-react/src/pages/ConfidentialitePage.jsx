import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './LegalPage.css'

function ConfidentialitePage() {
    const { t } = useTranslation()

    return (
        <div className="legal-page">
            <div className="legal-page-header">
                <div className="container">
                    <h1 className="page-title">{t('privacy.title')}</h1>
                    <p className="page-subtitle">{t('privacy.subtitle')}</p>
                    <span className="legal-last-update">{t('privacy.lastUpdate')}: 19 mars 2026</span>
                </div>
            </div>

            <div className="container">
                <div className="legal-content">
                    <div className="legal-highlight">
                        <p>{t('privacy.intro')}</p>
                    </div>

                    <nav className="legal-toc">
                        <h3>{t('privacy.tocTitle')}</h3>
                        <ol>
                            <li><a href="#responsable">{t('privacy.s1.title')}</a></li>
                            <li><a href="#collecte">{t('privacy.s2.title')}</a></li>
                            <li><a href="#finalites">{t('privacy.s3.title')}</a></li>
                            <li><a href="#base">{t('privacy.s4.title')}</a></li>
                            <li><a href="#conservation">{t('privacy.s5.title')}</a></li>
                            <li><a href="#partage">{t('privacy.s6.title')}</a></li>
                            <li><a href="#securite">{t('privacy.s7.title')}</a></li>
                            <li><a href="#droits">{t('privacy.s8.title')}</a></li>
                            <li><a href="#cookies">{t('privacy.s9.title')}</a></li>
                            <li><a href="#mineurs">{t('privacy.s10.title')}</a></li>
                            <li><a href="#modifications">{t('privacy.s11.title')}</a></li>
                            <li><a href="#contact-dpo">{t('privacy.s12.title')}</a></li>
                        </ol>
                    </nav>

                    <section className="legal-section" id="responsable">
                        <h2><span className="section-number">1</span> {t('privacy.s1.title')}</h2>
                        <p>{t('privacy.s1.p1')}</p>
                        <ul>
                            <li><strong>{t('privacy.s1.name')}:</strong> Goomu Fulo Wiɗto</li>
                            <li><strong>{t('privacy.s1.address')}:</strong> Dakar, Sénégal</li>
                            <li><strong>{t('privacy.s1.email')}:</strong> contact@goomufulowidto.org</li>
                            <li><strong>{t('privacy.s1.site')}:</strong> https://goomufulo.com</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="collecte">
                        <h2><span className="section-number">2</span> {t('privacy.s2.title')}</h2>
                        <p>{t('privacy.s2.p1')}</p>

                        <h3>{t('privacy.s2.sub1')}</h3>
                        <p>{t('privacy.s2.sub1p')}</p>
                        <ul>
                            <li>{t('privacy.s2.sub1l1')}</li>
                            <li>{t('privacy.s2.sub1l2')}</li>
                            <li>{t('privacy.s2.sub1l3')}</li>
                        </ul>

                        <h3>{t('privacy.s2.sub2')}</h3>
                        <p>{t('privacy.s2.sub2p')}</p>
                        <ul>
                            <li>{t('privacy.s2.sub2l1')}</li>
                            <li>{t('privacy.s2.sub2l2')}</li>
                            <li>{t('privacy.s2.sub2l3')}</li>
                        </ul>

                        <h3>{t('privacy.s2.sub3')}</h3>
                        <p>{t('privacy.s2.sub3p')}</p>
                        <ul>
                            <li>{t('privacy.s2.sub3l1')}</li>
                            <li>{t('privacy.s2.sub3l2')}</li>
                        </ul>

                        <h3>{t('privacy.s2.sub4')}</h3>
                        <p>{t('privacy.s2.sub4p')}</p>
                        <ul>
                            <li>{t('privacy.s2.sub4l1')}</li>
                            <li>{t('privacy.s2.sub4l2')}</li>
                            <li>{t('privacy.s2.sub4l3')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="finalites">
                        <h2><span className="section-number">3</span> {t('privacy.s3.title')}</h2>
                        <p>{t('privacy.s3.p1')}</p>
                        <ul>
                            <li>{t('privacy.s3.l1')}</li>
                            <li>{t('privacy.s3.l2')}</li>
                            <li>{t('privacy.s3.l3')}</li>
                            <li>{t('privacy.s3.l4')}</li>
                            <li>{t('privacy.s3.l5')}</li>
                            <li>{t('privacy.s3.l6')}</li>
                            <li>{t('privacy.s3.l7')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="base">
                        <h2><span className="section-number">4</span> {t('privacy.s4.title')}</h2>
                        <p>{t('privacy.s4.p1')}</p>
                        <ul>
                            <li><strong>{t('privacy.s4.l1t')}:</strong> {t('privacy.s4.l1d')}</li>
                            <li><strong>{t('privacy.s4.l2t')}:</strong> {t('privacy.s4.l2d')}</li>
                            <li><strong>{t('privacy.s4.l3t')}:</strong> {t('privacy.s4.l3d')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="conservation">
                        <h2><span className="section-number">5</span> {t('privacy.s5.title')}</h2>
                        <p>{t('privacy.s5.p1')}</p>
                        <ul>
                            <li>{t('privacy.s5.l1')}</li>
                            <li>{t('privacy.s5.l2')}</li>
                            <li>{t('privacy.s5.l3')}</li>
                        </ul>
                        <p>{t('privacy.s5.p2')}</p>
                    </section>

                    <section className="legal-section" id="partage">
                        <h2><span className="section-number">6</span> {t('privacy.s6.title')}</h2>
                        <p>{t('privacy.s6.p1')}</p>
                        <div className="legal-highlight">
                            <p>{t('privacy.s6.highlight')}</p>
                        </div>
                        <p>{t('privacy.s6.p2')}</p>
                        <ul>
                            <li>{t('privacy.s6.l1')}</li>
                            <li>{t('privacy.s6.l2')}</li>
                            <li>{t('privacy.s6.l3')}</li>
                        </ul>
                    </section>

                    <section className="legal-section" id="securite">
                        <h2><span className="section-number">7</span> {t('privacy.s7.title')}</h2>
                        <p>{t('privacy.s7.p1')}</p>
                        <ul>
                            <li>{t('privacy.s7.l1')}</li>
                            <li>{t('privacy.s7.l2')}</li>
                            <li>{t('privacy.s7.l3')}</li>
                            <li>{t('privacy.s7.l4')}</li>
                            <li>{t('privacy.s7.l5')}</li>
                        </ul>
                        <p>{t('privacy.s7.p2')}</p>
                    </section>

                    <section className="legal-section" id="droits">
                        <h2><span className="section-number">8</span> {t('privacy.s8.title')}</h2>
                        <p>{t('privacy.s8.p1')}</p>
                        <ul>
                            <li><strong>{t('privacy.s8.l1t')}:</strong> {t('privacy.s8.l1d')}</li>
                            <li><strong>{t('privacy.s8.l2t')}:</strong> {t('privacy.s8.l2d')}</li>
                            <li><strong>{t('privacy.s8.l3t')}:</strong> {t('privacy.s8.l3d')}</li>
                            <li><strong>{t('privacy.s8.l4t')}:</strong> {t('privacy.s8.l4d')}</li>
                            <li><strong>{t('privacy.s8.l5t')}:</strong> {t('privacy.s8.l5d')}</li>
                            <li><strong>{t('privacy.s8.l6t')}:</strong> {t('privacy.s8.l6d')}</li>
                        </ul>
                        <p>{t('privacy.s8.p2')}</p>
                    </section>

                    <section className="legal-section" id="cookies">
                        <h2><span className="section-number">9</span> {t('privacy.s9.title')}</h2>
                        <p>{t('privacy.s9.p1')}</p>
                        <h3>{t('privacy.s9.sub1')}</h3>
                        <ul>
                            <li><strong>{t('privacy.s9.sub1l1t')}:</strong> {t('privacy.s9.sub1l1d')}</li>
                            <li><strong>{t('privacy.s9.sub1l2t')}:</strong> {t('privacy.s9.sub1l2d')}</li>
                        </ul>
                        <h3>{t('privacy.s9.sub2')}</h3>
                        <p>{t('privacy.s9.sub2p')}</p>
                    </section>

                    <section className="legal-section" id="mineurs">
                        <h2><span className="section-number">10</span> {t('privacy.s10.title')}</h2>
                        <p>{t('privacy.s10.p1')}</p>
                        <p>{t('privacy.s10.p2')}</p>
                    </section>

                    <section className="legal-section" id="modifications">
                        <h2><span className="section-number">11</span> {t('privacy.s11.title')}</h2>
                        <p>{t('privacy.s11.p1')}</p>
                        <p>{t('privacy.s11.p2')}</p>
                    </section>

                    <section className="legal-section" id="contact-dpo">
                        <h2><span className="section-number">12</span> {t('privacy.s12.title')}</h2>
                        <p>{t('privacy.s12.p1')}</p>
                        <ul>
                            <li><strong>{t('privacy.s12.emailLabel')}:</strong> contact@goomufulowidto.org</li>
                            <li><strong>{t('privacy.s12.formLabel')}:</strong> <Link to="/contact">{t('privacy.s12.formLink')}</Link></li>
                        </ul>
                        <p>{t('privacy.s12.p2')}</p>
                    </section>

                    <div className="legal-contact-box">
                        <h3>{t('privacy.contactBox.title')}</h3>
                        <p>{t('privacy.contactBox.text')}</p>
                        <p>
                            <a href="mailto:contact@goomufulowidto.org">contact@goomufulowidto.org</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfidentialitePage

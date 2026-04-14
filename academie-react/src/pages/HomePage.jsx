import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero'
import Features from '../components/Features'
import News from '../components/News'
import Dictionary from '../components/Dictionary'
import Scholars from '../components/Scholars'

function HomePage() {
    return (
        <>
            <Hero />
            <Features />
            <News />
            <Dictionary />
            <Scholars />
        </>
    )
}

export default HomePage

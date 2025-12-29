import { useTranslation } from 'react-i18next'
import Hero from '../components/Hero'
import Features from '../components/Features'
import News from '../components/News'
import DireNePasDire from '../components/DireNePasDire'
import Dictionary from '../components/Dictionary'

function HomePage() {
    return (
        <>
            <Hero />
            <Features />
            <News />
            <DireNePasDire />
            <Dictionary />
        </>
    )
}

export default HomePage

import Hero from '../components/Hero'
import Features from '../components/Features'
import News from '../components/News'
import Patrimoine from '../components/Patrimoine'
import Dictionary from '../components/Dictionary'

function HomePage() {
    return (
        <>
            <Hero />
            <Dictionary />
            <Features />
            <Patrimoine />
            <News />
        </>
    )
}

export default HomePage

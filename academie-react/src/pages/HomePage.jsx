import Hero from '../components/Hero'
import News from '../components/News'
import Patrimoine from '../components/Patrimoine'
import Dictionary from '../components/Dictionary'
import Heart3DFeature from '../components/Heart3DFeature'

function HomePage() {
    return (
        <>
            <Hero />
            <Heart3DFeature />
            <Patrimoine />
            <News />
            <Dictionary />
        </>
    )
}

export default HomePage

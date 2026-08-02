import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'

import './src/i18n'
import RootNavigator from './src/navigation/RootNavigator'

// Le splash reste affiché jusqu'au premier rendu de la navigation, ce qui
// évite le flash de fond nu entre l'écran de lancement natif et l'app.
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
    useEffect(() => {
        SplashScreen.hideAsync().catch(() => {})
    }, [])

    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <RootNavigator />
        </SafeAreaProvider>
    )
}

import { useRef, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTranslation } from 'react-i18next'

import EmptyState from '../components/EmptyState'
import { WEB_URL } from '../config'
import { colors } from '../theme'

// Contenus longs et éditorialisés (bibliothèque, histoire, terminologie…).
// Les réécrire en natif dupliquerait la mise en forme riche déjà maintenue
// côté site ; ils sont donc affichés tels quels, dans la coquille native.
export default function WebScreen({ route }) {
    const { path } = route.params
    const { t, i18n } = useTranslation()
    const language = (i18n.language || 'ff').substring(0, 2)
    const webviewRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    // La page lit sa langue dans localStorage (clé i18nextLng côté site) :
    // on l'aligne sur celle de l'app avant le rendu pour éviter un flash
    // dans la mauvaise langue.
    const injectedBeforeLoad = `
        try { localStorage.setItem('i18nextLng', '${language}') } catch (e) {}
        true;
    `

    const handleRetry = () => {
        setFailed(false)
        setLoading(true)
        setReloadKey(key => key + 1)
    }

    if (failed) {
        return (
            <View style={styles.container}>
                <EmptyState
                    icon="cloud-offline-outline"
                    title={t('common.error')}
                    hint={t('offline.noData')}
                    actionLabel={t('common.retry')}
                    onAction={handleRetry}
                />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <WebView
                key={reloadKey}
                ref={webviewRef}
                source={{ uri: `${WEB_URL}${path}` }}
                injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setLoading(false)
                    setFailed(true)
                }}
                onHttpError={({ nativeEvent }) => {
                    if (nativeEvent.statusCode >= 500) {
                        setLoading(false)
                        setFailed(true)
                    }
                }}
                startInLoadingState={false}
                allowsBackForwardNavigationGestures
                decelerationRate="normal"
                style={styles.webview}
            />

            {loading && (
                <View style={styles.loader} pointerEvents="none">
                    <ActivityIndicator size="large" color={colors.gold} />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    webview: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cream,
    },
})

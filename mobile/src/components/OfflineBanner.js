import { View, Text, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { colors, spacing } from '../theme'

// Affiché quand les données proviennent du cache local : l'utilisateur doit
// savoir qu'il consulte une copie, pas l'état courant du serveur.
export default function OfflineBanner({ visible }) {
    const { t } = useTranslation()
    if (!visible) return null

    return (
        <View style={styles.banner}>
            <Ionicons name="cloud-offline-outline" size={16} color={colors.dark} />
            <Text style={styles.text}>{t('offline.banner')}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.goldLight,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    text: {
        color: colors.dark,
        fontSize: 13,
        fontWeight: '600',
    },
})

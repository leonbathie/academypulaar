import { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, shadow, spacing } from '../theme'
import AudioButton from './AudioButton'

// Traduction affichée sous le mot : on suit la langue de l'interface et on
// retombe sur le français, seule colonne renseignée pour toutes les entrées.
export function translationFor(entry, language) {
    const byLang = {
        fr: entry.translation_fr,
        en: entry.translation_en,
        ff: entry.translation_ff,
    }
    return byLang[language] || entry.translation_fr || ''
}

function WordCard({ entry, language, onPress, isFavorite, onToggleFavorite }) {
    const translation = translationFor(entry, language)
    const domains = Array.isArray(entry.domains) ? entry.domains : []

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            <View style={styles.header}>
                <View style={styles.titleBlock}>
                    <Text style={styles.word}>{entry.word}</Text>
                    {!!translation && (
                        <Text style={styles.translation} numberOfLines={2}>
                            {translation}
                        </Text>
                    )}
                </View>

                <View style={styles.actions}>
                    {!!entry.audio_word && (
                        <AudioButton source={entry.audio_word} label={entry.word} compact />
                    )}
                    {onToggleFavorite && (
                        <Pressable
                            onPress={onToggleFavorite}
                            hitSlop={8}
                            accessibilityRole="button"
                            style={styles.starButton}
                        >
                            <Ionicons
                                name={isFavorite ? 'star' : 'star-outline'}
                                size={22}
                                color={isFavorite ? colors.gold : colors.mediumGray}
                            />
                        </Pressable>
                    )}
                </View>
            </View>

            {domains.length > 0 && (
                <View style={styles.tags}>
                    {domains.slice(0, 3).map(domain => (
                        <View key={domain} style={styles.tag}>
                            <Text style={styles.tagText}>{domain}</Text>
                        </View>
                    ))}
                </View>
            )}
        </Pressable>
    )
}

// Les listes de résultats peuvent dépasser le millier d'entrées : sans memo,
// chaque frappe dans la recherche re-rendrait toutes les cartes montées.
export default memo(WordCard)

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadow,
    },
    pressed: {
        opacity: 0.85,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    titleBlock: {
        flex: 1,
    },
    word: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.dark,
    },
    translation: {
        marginTop: 2,
        fontSize: 15,
        color: colors.darkGray,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    starButton: {
        padding: spacing.xs,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    tag: {
        backgroundColor: colors.sand,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    tagText: {
        fontSize: 12,
        color: colors.darkGray,
    },
})

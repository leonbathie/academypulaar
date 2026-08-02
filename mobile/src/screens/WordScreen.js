import { useEffect, useLayoutEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, Share, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'

import AudioButton from '../components/AudioButton'
import { translationFor } from '../components/WordCard'
import { isFavorite as checkFavorite, toggleFavorite } from '../storage/favorites'
import { track } from '../api/client'
import { mediaUrl, WEB_URL } from '../config'
import { colors, radius, shadow, spacing } from '../theme'

export default function WordScreen({ route, navigation }) {
    const { entry } = route.params
    const { t, i18n } = useTranslation()
    const language = (i18n.language || 'ff').substring(0, 2)
    const [favorite, setFavorite] = useState(false)

    useEffect(() => {
        checkFavorite(entry.id).then(setFavorite)
        track(`/api/dictionary/track-view/${entry.id}`)
    }, [entry.id])

    // L'étoile vit dans la barre de navigation : c'est l'emplacement attendu
    // sur iOS pour une action sur l'élément affiché.
    useLayoutEffect(() => {
        navigation.setOptions({
            title: entry.word,
            headerRight: () => (
                <Pressable
                    onPress={async () => setFavorite(await toggleFavorite(entry))}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={favorite ? t('favorites.remove') : t('favorites.add')}
                >
                    <Ionicons
                        name={favorite ? 'star' : 'star-outline'}
                        size={24}
                        color={favorite ? colors.gold : colors.white}
                    />
                </Pressable>
            ),
        })
    }, [navigation, entry, favorite, t])

    const translation = translationFor(entry, language)
    const image = mediaUrl(entry.image)
    const domains = Array.isArray(entry.domains) ? entry.domains : []

    const handleShare = () => {
        const lines = [entry.word]
        if (translation) lines.push(translation)
        lines.push(`${WEB_URL}/dictionnaire`)
        Share.share({ message: lines.join('\n') }).catch(() => {})
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {!!image && (
                <Image
                    source={{ uri: image }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                    accessibilityLabel={entry.word}
                />
            )}

            <View style={styles.card}>
                <Text style={styles.word}>{entry.word}</Text>
                {!!translation && <Text style={styles.translation}>{translation}</Text>}

                {domains.length > 0 && (
                    <View style={styles.tags}>
                        {domains.map(domain => (
                            <View key={domain} style={styles.tag}>
                                <Text style={styles.tagText}>{domain}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {!!entry.audio_word && (
                    <View style={styles.audioRow}>
                        <AudioButton
                            source={entry.audio_word}
                            label={t('dictionary.listenPronunciation')}
                        />
                    </View>
                )}
            </View>

            {!!entry.example && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{t('dictionary.example')}</Text>
                    <Text style={styles.example}>{entry.example}</Text>
                    {!!entry.example_translation && (
                        <Text style={styles.exampleTranslation}>{entry.example_translation}</Text>
                    )}
                    {!!entry.audio_example && (
                        <View style={styles.audioRow}>
                            <AudioButton
                                source={entry.audio_example}
                                label={t('dictionary.listenExample')}
                            />
                        </View>
                    )}
                </View>
            )}

            <Pressable
                onPress={handleShare}
                accessibilityRole="button"
                style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
            >
                <Ionicons name="share-outline" size={18} color={colors.white} />
                <Text style={styles.shareText}>{t('common.share')}</Text>
            </Pressable>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.md,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: radius.lg,
        backgroundColor: colors.sand,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        ...shadow,
    },
    word: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.dark,
    },
    translation: {
        marginTop: spacing.xs,
        fontSize: 18,
        color: colors.darkGray,
        lineHeight: 26,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.md,
    },
    tag: {
        backgroundColor: colors.sand,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
    },
    tagText: {
        fontSize: 12,
        color: colors.darkGray,
    },
    audioRow: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.mediumGray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    example: {
        fontSize: 17,
        color: colors.dark,
        lineHeight: 25,
    },
    exampleTranslation: {
        marginTop: spacing.xs,
        fontSize: 15,
        color: colors.mediumGray,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.dark,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
    },
    pressed: {
        opacity: 0.8,
    },
    shareText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
})

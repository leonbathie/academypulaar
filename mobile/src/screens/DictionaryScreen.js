import { useEffect, useMemo, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'

import { useDictionary, searchEntries, extractDomains, ALPHABET } from '../hooks/useDictionary'
import { getFavorites, toggleFavorite } from '../storage/favorites'
import { track } from '../api/client'
import WordCard from '../components/WordCard'
import OfflineBanner from '../components/OfflineBanner'
import EmptyState from '../components/EmptyState'
import { colors, radius, spacing } from '../theme'

export default function DictionaryScreen({ navigation, route }) {
    const { t, i18n } = useTranslation()
    const language = (i18n.language || 'ff').substring(0, 2)

    const { entries, loading, fromCache, failed, reload } = useDictionary()
    const [term, setTerm] = useState(route.params?.initialSearch ?? '')
    const [letter, setLetter] = useState(null)
    const [domain, setDomain] = useState(null)
    const [favoriteIds, setFavoriteIds] = useState([])

    useEffect(() => {
        getFavorites().then(list => setFavoriteIds(list.map(entry => entry.id)))
    }, [])

    // Remonte au serveur ce que les gens cherchent, comme le fait le site.
    // Temporisé : sans ça on enverrait une requête par caractère tapé.
    useEffect(() => {
        if (term.trim().length < 2) return
        const timer = setTimeout(() => track('/api/dictionary/track-search', { term: term.trim() }), 800)
        return () => clearTimeout(timer)
    }, [term])

    const domains = useMemo(() => extractDomains(entries), [entries])
    const results = useMemo(
        () => searchEntries(entries, term, letter, domain),
        [entries, term, letter, domain]
    )

    const handleToggleFavorite = async entry => {
        const nowFavorite = await toggleFavorite(entry)
        setFavoriteIds(current =>
            nowFavorite ? [...current, entry.id] : current.filter(id => id !== entry.id)
        )
    }

    const showPrompt = !term && !letter && !domain

    if (loading && entries.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.gold} />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (failed && entries.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <EmptyState
                    icon="cloud-offline-outline"
                    title={t('common.error')}
                    hint={t('offline.noData')}
                    actionLabel={t('common.retry')}
                    onAction={reload}
                />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner visible={fromCache} />

            <View style={styles.searchRow}>
                <Ionicons name="search" size={18} color={colors.mediumGray} />
                <TextInput
                    value={term}
                    onChangeText={setTerm}
                    placeholder={t('dictionary.searchPlaceholder')}
                    placeholderTextColor={colors.mediumGray}
                    style={styles.input}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    accessibilityLabel={t('common.search')}
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                contentContainerStyle={styles.filterContent}
            >
                <FilterChip
                    label={t('dictionary.allDomains')}
                    active={!letter && !domain}
                    onPress={() => {
                        setLetter(null)
                        setDomain(null)
                    }}
                />
                {ALPHABET.map(char => (
                    <FilterChip
                        key={char}
                        label={char.toUpperCase()}
                        active={letter === char}
                        onPress={() => setLetter(letter === char ? null : char)}
                    />
                ))}
            </ScrollView>

            {domains.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterRow}
                    contentContainerStyle={styles.filterContent}
                >
                    {domains.map(item => (
                        <FilterChip
                            key={item}
                            label={item}
                            active={domain === item}
                            onPress={() => setDomain(domain === item ? null : item)}
                        />
                    ))}
                </ScrollView>
            )}

            {!showPrompt && (
                <Text style={styles.count}>
                    {results.length}{' '}
                    {results.length === 1 ? t('dictionary.result') : t('dictionary.results')}
                </Text>
            )}

            <FlatList
                data={showPrompt ? entries.slice(0, 50) : results}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={12}
                windowSize={10}
                removeClippedSubviews
                renderItem={({ item }) => (
                    <WordCard
                        entry={item}
                        language={language}
                        isFavorite={favoriteIds.includes(item.id)}
                        onToggleFavorite={() => handleToggleFavorite(item)}
                        onPress={() => navigation.navigate('Word', { entry: item })}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        title={t('dictionary.noResults')}
                        hint={t('dictionary.searchPrompt')}
                    />
                }
            />
        </SafeAreaView>
    )
}

function FilterChip({ label, active, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
            ]}
        >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    loadingText: {
        color: colors.darkGray,
        fontSize: 15,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.white,
        marginHorizontal: spacing.md,
        marginTop: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    input: {
        flex: 1,
        paddingVertical: spacing.sm + 4,
        fontSize: 16,
        color: colors.dark,
    },
    filterRow: {
        flexGrow: 0,
        marginTop: spacing.sm,
    },
    filterContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.pill,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lightGray,
    },
    chipActive: {
        backgroundColor: colors.dark,
        borderColor: colors.dark,
    },
    chipPressed: {
        opacity: 0.7,
    },
    chipText: {
        fontSize: 14,
        color: colors.darkGray,
    },
    chipTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    count: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        fontSize: 13,
        color: colors.mediumGray,
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
})

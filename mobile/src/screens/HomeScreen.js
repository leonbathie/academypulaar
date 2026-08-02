import { useCallback, useEffect, useState } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    TextInput,
    RefreshControl,
    StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'

import { apiGet } from '../api/client'
import { mediaUrl } from '../config'
import OfflineBanner from '../components/OfflineBanner'
import { colors, radius, shadow, spacing } from '../theme'

export default function HomeScreen({ navigation }) {
    const { t, i18n } = useTranslation()
    const language = (i18n.language || 'ff').substring(0, 2)

    const [stats, setStats] = useState(null)
    const [news, setNews] = useState([])
    const [scholars, setScholars] = useState([])
    const [offline, setOffline] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [term, setTerm] = useState('')

    const load = useCallback(async () => {
        const [statsRes, newsRes, scholarsRes] = await Promise.all([
            apiGet('/api/dictionary/stats', 'home:stats'),
            apiGet('/api/news?published=true&limit=4', 'home:news'),
            apiGet('/api/scholars', 'home:scholars'),
        ])

        if (statsRes.data) setStats(statsRes.data)
        if (newsRes.data) setNews(Array.isArray(newsRes.data) ? newsRes.data : [])
        if (scholarsRes.data) setScholars(Array.isArray(scholarsRes.data) ? scholarsRes.data : [])

        setOffline(statsRes.fromCache || newsRes.fromCache || scholarsRes.fromCache)
    }, [])

    useEffect(() => {
        load()
    }, [load])

    const handleRefresh = async () => {
        setRefreshing(true)
        await load()
        setRefreshing(false)
    }

    const submitSearch = () => {
        navigation.navigate('Dictionnaire', { initialSearch: term })
        setTerm('')
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner visible={offline} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
                }
            >
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>{t('common.siteName')}</Text>
                    <Text style={styles.heroSubtitle}>{t('common.siteSlogan')}</Text>
                </View>

                <Pressable style={styles.searchRow} onPress={submitSearch}>
                    <Ionicons name="search" size={18} color={colors.mediumGray} />
                    <TextInput
                        value={term}
                        onChangeText={setTerm}
                        onSubmitEditing={submitSearch}
                        placeholder={t('home.quickSearch')}
                        placeholderTextColor={colors.mediumGray}
                        style={styles.searchInput}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                        accessibilityLabel={t('common.search')}
                    />
                </Pressable>

                {!!stats && (
                    <View style={styles.statsRow}>
                        <StatTile value={stats.total} label={t('home.wordsTranslated')} />
                        <StatTile value={stats.domains} label={t('home.domains')} />
                    </View>
                )}

                {news.length > 0 && (
                    <Section title={t('home.news')}>
                        {news.map(item => (
                            <NewsCard key={item.id} item={item} language={language} />
                        ))}
                    </Section>
                )}

                {scholars.length > 0 && (
                    <Section title={t('home.scholars')}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.scholarRow}
                        >
                            {scholars.slice(0, 10).map(scholar => (
                                <ScholarCard key={scholar.id} scholar={scholar} />
                            ))}
                        </ScrollView>
                    </Section>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

function StatTile({ value, label }) {
    return (
        <View style={styles.statTile}>
            <Text style={styles.statValue}>{value ?? '—'}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    )
}

function Section({ title, children }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    )
}

// Les colonnes traduites sont optionnelles en base : on retombe sur la
// colonne générique quand la langue courante n'a pas été renseignée.
function localized(item, field, language) {
    return item[`${field}_${language}`] || item[field] || ''
}

function NewsCard({ item, language }) {
    const image = mediaUrl(item.image)
    return (
        <View style={styles.newsCard}>
            {!!image && (
                <Image source={{ uri: image }} style={styles.newsImage} contentFit="cover" transition={200} />
            )}
            <View style={styles.newsBody}>
                <Text style={styles.newsTitle} numberOfLines={2}>
                    {localized(item, 'title', language)}
                </Text>
                {!!localized(item, 'excerpt', language) && (
                    <Text style={styles.newsExcerpt} numberOfLines={3}>
                        {localized(item, 'excerpt', language)}
                    </Text>
                )}
            </View>
        </View>
    )
}

function ScholarCard({ scholar }) {
    const image = mediaUrl(scholar.image)
    return (
        <View style={styles.scholarCard}>
            {!!image && (
                <Image source={{ uri: image }} style={styles.scholarImage} contentFit="cover" transition={200} />
            )}
            <Text style={styles.scholarName} numberOfLines={2}>
                {scholar.name}
            </Text>
            {!!scholar.years && <Text style={styles.scholarYears}>{scholar.years}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    hero: {
        backgroundColor: colors.dark,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.goldLight,
    },
    heroSubtitle: {
        marginTop: spacing.xs,
        fontSize: 15,
        color: colors.sand,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.white,
        marginHorizontal: spacing.md,
        marginTop: -spacing.lg,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        ...shadow,
    },
    searchInput: {
        flex: 1,
        paddingVertical: spacing.sm + 4,
        fontSize: 16,
        color: colors.dark,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.lg,
    },
    statTile: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        ...shadow,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.gold,
    },
    statLabel: {
        marginTop: 2,
        fontSize: 13,
        color: colors.darkGray,
        textAlign: 'center',
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
        fontSize: 20,
        fontWeight: '700',
        color: colors.dark,
    },
    newsCard: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        overflow: 'hidden',
        ...shadow,
    },
    newsImage: {
        width: '100%',
        height: 150,
        backgroundColor: colors.sand,
    },
    newsBody: {
        padding: spacing.md,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
    },
    newsExcerpt: {
        marginTop: spacing.xs,
        fontSize: 14,
        color: colors.darkGray,
        lineHeight: 20,
    },
    scholarRow: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    scholarCard: {
        width: 130,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.sm,
        ...shadow,
    },
    scholarImage: {
        width: '100%',
        height: 130,
        borderRadius: radius.md,
        backgroundColor: colors.sand,
    },
    scholarName: {
        marginTop: spacing.sm,
        fontSize: 14,
        fontWeight: '600',
        color: colors.dark,
    },
    scholarYears: {
        fontSize: 12,
        color: colors.mediumGray,
    },
})

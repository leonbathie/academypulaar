import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as WebBrowser from 'expo-web-browser'
import { useTranslation } from 'react-i18next'

import { changeLanguage, LANGUAGES } from '../i18n'
import { WEB_URL } from '../config'
import { colors, radius, shadow, spacing } from '../theme'

// Chaque entrée ouvre la page correspondante du site dans la WebView interne.
const SECTIONS = [
    {
        titleKey: 'more.explore',
        items: [
            { key: 'terminology', path: '/terminologie', icon: 'library-outline' },
            { key: 'sayDontSay', path: '/dire', icon: 'checkmark-circle-outline' },
            { key: 'languageQuestions', path: '/questions-langue', icon: 'help-circle-outline' },
            { key: 'library', path: '/bibliotheque', icon: 'book-outline' },
        ],
    },
    {
        titleKey: 'more.about',
        items: [
            { key: 'history', path: '/a-propos/histoire', icon: 'time-outline' },
            { key: 'missions', path: '/a-propos/missions', icon: 'flag-outline' },
            { key: 'contact', path: '/contact', icon: 'mail-outline' },
        ],
    },
    {
        titleKey: 'more.legal',
        items: [
            { key: 'legal', path: '/mentions-legales', icon: 'document-text-outline' },
            { key: 'privacy', path: '/confidentialite', icon: 'shield-checkmark-outline' },
        ],
    },
]

export default function MoreScreen({ navigation }) {
    const { t, i18n } = useTranslation()
    const current = (i18n.language || 'ff').substring(0, 2)

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.group}>
                    <Text style={styles.groupTitle}>{t('more.language')}</Text>
                    <View style={styles.card}>
                        {LANGUAGES.map((language, index) => (
                            <Pressable
                                key={language.code}
                                onPress={() => changeLanguage(language.code)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: current === language.code }}
                                style={({ pressed }) => [
                                    styles.row,
                                    index > 0 && styles.rowBorder,
                                    pressed && styles.pressed,
                                ]}
                            >
                                <Text style={styles.rowLabel}>{language.label}</Text>
                                {current === language.code && (
                                    <Ionicons name="checkmark" size={20} color={colors.gold} />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>

                {SECTIONS.map(section => (
                    <View key={section.titleKey} style={styles.group}>
                        <Text style={styles.groupTitle}>{t(section.titleKey)}</Text>
                        <View style={styles.card}>
                            {section.items.map((item, index) => (
                                <Pressable
                                    key={item.key}
                                    onPress={() =>
                                        navigation.navigate('Web', {
                                            path: item.path,
                                            title: t(`more.${item.key}`),
                                        })
                                    }
                                    accessibilityRole="button"
                                    style={({ pressed }) => [
                                        styles.row,
                                        index > 0 && styles.rowBorder,
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <Ionicons name={item.icon} size={20} color={colors.darkGray} />
                                    <Text style={[styles.rowLabel, styles.rowLabelWithIcon]}>
                                        {t(`more.${item.key}`)}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={18} color={colors.mediumGray} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}

                <Pressable
                    onPress={() => WebBrowser.openBrowserAsync(WEB_URL)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.externalLink, pressed && styles.pressed]}
                >
                    <Ionicons name="open-outline" size={18} color={colors.darkGray} />
                    <Text style={styles.externalText}>{t('more.openInBrowser')}</Text>
                </Pressable>
            </ScrollView>
        </View>
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
    },
    group: {
        marginBottom: spacing.lg,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.mediumGray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        overflow: 'hidden',
        ...shadow,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    rowBorder: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.lightGray,
    },
    pressed: {
        opacity: 0.7,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        color: colors.dark,
    },
    rowLabelWithIcon: {
        marginLeft: 0,
    },
    externalLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    externalText: {
        fontSize: 15,
        color: colors.darkGray,
    },
})

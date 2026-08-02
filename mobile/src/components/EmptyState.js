import { View, Text, Pressable, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { colors, radius, spacing } from '../theme'

// État vide générique : recherche sans résultat, favoris vides, échec réseau
// sans cache. `action` est optionnel (bouton « Réessayer »).
export default function EmptyState({ icon = 'search-outline', title, hint, actionLabel, onAction }) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={44} color={colors.mediumGray} />
            <Text style={styles.title}>{title}</Text>
            {!!hint && <Text style={styles.hint}>{hint}</Text>}
            {!!actionLabel && !!onAction && (
                <Pressable
                    onPress={onAction}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </Pressable>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
        paddingHorizontal: spacing.xl,
        gap: spacing.sm,
    },
    title: {
        marginTop: spacing.sm,
        fontSize: 17,
        fontWeight: '600',
        color: colors.darkGray,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: colors.mediumGray,
        textAlign: 'center',
        lineHeight: 20,
    },
    action: {
        marginTop: spacing.md,
        backgroundColor: colors.dark,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.pill,
    },
    pressed: {
        opacity: 0.8,
    },
    actionText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 15,
    },
})

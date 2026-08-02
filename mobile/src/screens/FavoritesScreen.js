import { useCallback, useState } from 'react'
import { View, FlatList, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

import { getFavorites, removeFavorite } from '../storage/favorites'
import WordCard from '../components/WordCard'
import EmptyState from '../components/EmptyState'
import { colors, spacing } from '../theme'

export default function FavoritesScreen({ navigation }) {
    const { t, i18n } = useTranslation()
    const language = (i18n.language || 'ff').substring(0, 2)
    const [favorites, setFavorites] = useState([])

    // Rechargé à chaque affichage de l'onglet : un mot peut avoir été ajouté
    // ou retiré depuis le dictionnaire ou la fiche entre deux visites.
    useFocusEffect(
        useCallback(() => {
            getFavorites().then(setFavorites)
        }, [])
    )

    const handleRemove = async id => {
        setFavorites(await removeFavorite(id))
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={favorites}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <WordCard
                        entry={item}
                        language={language}
                        isFavorite
                        onToggleFavorite={() => handleRemove(item.id)}
                        onPress={() => navigation.navigate('Word', { entry: item })}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="star-outline"
                        title={t('favorites.empty')}
                        hint={t('favorites.emptyHint')}
                    />
                }
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.cream,
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
})

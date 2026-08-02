import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'

import HomeScreen from '../screens/HomeScreen'
import DictionaryScreen from '../screens/DictionaryScreen'
import FavoritesScreen from '../screens/FavoritesScreen'
import WordScreen from '../screens/WordScreen'
import WebScreen from '../screens/WebScreen'
import MoreScreen from '../screens/MoreScreen'
import { colors } from '../theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const TAB_ICONS = {
    Accueil: ['home', 'home-outline'],
    Dictionnaire: ['book', 'book-outline'],
    Favoris: ['star', 'star-outline'],
    Bibliothèque: ['library', 'library-outline'],
    Plus: ['ellipsis-horizontal', 'ellipsis-horizontal-outline'],
}

// Accueil et Dictionnaire gèrent eux-mêmes le haut de l'écran (bandeau
// héros, barre de recherche) et restent donc sans en-tête. Les trois autres
// en reçoivent un : sans lui, la WebView passerait sous la barre d'état.
const HEADERLESS_TABS = ['Accueil', 'Dictionnaire']

function Tabs() {
    const { t } = useTranslation()

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: !HEADERLESS_TABS.includes(route.name),
                headerStyle: { backgroundColor: colors.dark },
                headerTintColor: colors.white,
                headerTitleStyle: { fontWeight: '700' },
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.mediumGray,
                tabBarStyle: { backgroundColor: colors.white },
                tabBarIcon: ({ focused, color, size }) => {
                    const [active, inactive] = TAB_ICONS[route.name]
                    return <Ionicons name={focused ? active : inactive} size={size} color={color} />
                },
            })}
        >
            <Tab.Screen name="Accueil" component={HomeScreen} options={{ title: t('tabs.home') }} />
            <Tab.Screen
                name="Dictionnaire"
                component={DictionaryScreen}
                options={{ title: t('tabs.dictionary') }}
            />
            <Tab.Screen
                name="Favoris"
                component={FavoritesScreen}
                options={{ title: t('tabs.favorites') }}
            />
            <Tab.Screen
                name="Bibliothèque"
                component={WebScreen}
                initialParams={{ path: '/bibliotheque' }}
                options={{ title: t('tabs.library') }}
            />
            <Tab.Screen name="Plus" component={MoreScreen} options={{ title: t('tabs.more') }} />
        </Tab.Navigator>
    )
}

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: { backgroundColor: colors.dark },
                    headerTintColor: colors.white,
                    headerTitleStyle: { fontWeight: '700' },
                    contentStyle: { backgroundColor: colors.cream },
                }}
            >
                <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
                <Stack.Screen name="Word" component={WordScreen} />
                <Stack.Screen
                    name="Web"
                    component={WebScreen}
                    options={({ route }) => ({ title: route.params?.title ?? '' })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

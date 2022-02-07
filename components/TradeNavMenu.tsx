import { Fragment, FunctionComponent, useEffect, useRef, useState } from 'react'
import { Popover, Transition } from '@headlessui/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { StarIcon, QuestionMarkCircleIcon } from '@heroicons/react/outline'
import {
  ChevronDownIcon,
  StarIcon as FilledStarIcon,
} from '@heroicons/react/solid'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import * as MonoIcons from './icons'
import { initialMarket } from './SettingsModal'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { getWeights } from '@blockworks-foundation/mango-client'
import useMangoStore from '../stores/useMangoStore'

const initialMenuCategories = [
  { name: 'Spot', desc: 'spot-desc' },
  { name: 'Perp', desc: 'perp-desc' },
]

export const FAVORITE_MARKETS_KEY = 'favoriteMarkets'

const TradeNavMenu = () => {
  const [favoriteMarkets] = useLocalStorageState(FAVORITE_MARKETS_KEY, [])
  const [activeMenuCategory, setActiveMenuCategory] = useState('Spot')
  const [menuCategories, setMenuCategories] = useState(initialMenuCategories)
  const [openState, setOpenState] = useState(false)
  const buttonRef = useRef(null)
  const groupConfig = useMangoGroupConfig()
  const { asPath } = useRouter()
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  let timeout
  const timeoutDuration = 200

  const markets =
    activeMenuCategory === 'Favorites'
      ? favoriteMarkets
      : activeMenuCategory === 'Spot'
      ? [...groupConfig.spotMarkets]
      : [...groupConfig.perpMarkets]

  const handleMenuCategoryChange = (categoryName) => {
    setActiveMenuCategory(categoryName)
  }

  const renderIcon = (symbol) => {
    const iconName = `${symbol.slice(0, 1)}${symbol
      .slice(1, 4)
      .toLowerCase()}MonoIcon`

    const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
    return <SymbolIcon className={`h-3.5 w-auto mr-2`} />
  }

  const toggleMenu = () => {
    setOpenState((openState) => !openState)
    buttonRef?.current?.click()
    if (favoriteMarkets.length > 0) {
      setActiveMenuCategory('Favorites')
    } else {
      setActiveMenuCategory('Spot')
    }
  }

  const handleClick = (open) => {
    setOpenState(!open)
    clearTimeout(timeout)
  }

  const onHoverMenu = (open, action) => {
    if (
      (!open && !openState && action === 'onMouseEnter') ||
      (open && openState && action === 'onMouseLeave')
    ) {
      clearTimeout(timeout)
      timeout = setTimeout(() => toggleMenu(), timeoutDuration)
    }
  }

  const handleClickOutside = (event) => {
    if (buttonRef.current && !buttonRef.current.contains(event.target)) {
      event.stopPropagation()
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  useEffect(() => {
    if (favoriteMarkets.length > 0 && menuCategories.length === 2) {
      const newCategories = [{ name: 'Favorites', desc: '' }, ...menuCategories]
      setMenuCategories(newCategories)
    }
    if (favoriteMarkets.length === 0 && menuCategories.length === 3) {
      setMenuCategories(
        menuCategories.filter((cat) => cat.name !== 'Favorites')
      )
      if (activeMenuCategory === 'Favorites') {
        setActiveMenuCategory('Spot')
      }
    }
  }, [favoriteMarkets])

  const getMarketLeverage = (market) => {
    if (!mangoGroup) return 1
    const ws = getWeights(mangoGroup, market.marketIndex, 'Init')
    const w = market.name.includes('PERP')
      ? ws.perpAssetWeight
      : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }

  return (
    <Popover>
      {({ open }) => (
        <div
          onMouseEnter={() => onHoverMenu(open, 'onMouseEnter')}
          onMouseLeave={() => onHoverMenu(open, 'onMouseLeave')}
          className="flex flex-col"
        >
          <Popover.Button
            className={`-mr-3 px-3 rounded-none focus:outline-none focus:bg-th-bkg-3 ${
              open && 'bg-th-bkg-3'
            }`}
            ref={buttonRef}
          >
            <div
              className={`flex h-14 items-center rounded-none hover:text-th-primary`}
              onClick={() => handleClick(open)}
            >
              <span>{t('trade')}</span>
              <ChevronDownIcon
                className={`default-transition h-5 ml-0.5 w-5 ${
                  open ? 'transform rotate-180' : 'transform rotate-360'
                }`}
              />
            </div>
          </Popover.Button>

          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0 transform scale-75"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute grid grid-cols-3 grid-rows-1 top-14 w-[700px] z-10">
              <div className="bg-th-bkg-4 col-span-1 rounded-bl-lg">
                <MenuCategories
                  activeCategory={activeMenuCategory}
                  categories={menuCategories}
                  onChange={handleMenuCategoryChange}
                />
              </div>
              <div className="bg-th-bkg-3 col-span-2 p-4 rounded-br-lg">
                <div className="grid grid-cols-2 grid-flow-row gap-x-4 gap-y-2.5">
                  {markets.map((mkt) => (
                    <div className="col-span-1 text-th-fgd-3" key={mkt.name}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={{
                            pathname: '/',
                            query: { name: mkt.name },
                          }}
                          shallow={true}
                        >
                          <a
                            className={`flex items-center text-xs hover:text-th-primary w-full whitespace-nowrap ${
                              asPath.includes(mkt.name) ||
                              (asPath === '/' &&
                                initialMarket.name === mkt.name)
                                ? 'text-th-primary'
                                : 'text-th-fgd-1'
                            }`}
                          >
                            {renderIcon(mkt.baseSymbol)}
                            {mkt.name}
                            <span className="ml-1.5 text-xs text-th-fgd-4">
                              {getMarketLeverage(mkt)}x
                            </span>
                          </a>
                        </Link>
                        <FavoriteMarketButton market={mkt} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  )
}

export default TradeNavMenu

interface MenuCategoriesProps {
  activeCategory: string
  onChange: (x) => void
  categories: Array<any>
}

const MenuCategories: FunctionComponent<MenuCategoriesProps> = ({
  activeCategory,
  onChange,
  categories,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className={`relative`}>
      <div
        className={`absolute bg-th-primary top-0 default-transition left-0 w-0.5 z-10`}
        style={{
          transform: `translateY(${
            categories.findIndex((cat) => cat.name === activeCategory) * 100
          }%)`,
          height: `${100 / categories.length}%`,
        }}
      />
      {categories.map((cat) => {
        return (
          <button
            key={cat.name}
            onClick={() => onChange(cat.name)}
            onMouseEnter={() => onChange(cat.name)}
            className={`cursor-pointer default-transition flex flex-col h-14 justify-center px-4 relative rounded-none w-full whitespace-nowrap hover:bg-th-bkg-3
                      ${
                        activeCategory === cat.name
                          ? `bg-th-bkg-3 text-th-primary`
                          : `text-th-fgd-2 hover:text-th-primary`
                      }
                    `}
          >
            {t(cat.name.toLowerCase().replace(' ', '-'))}
            <div className="text-th-fgd-4 text-xs">{t(cat.desc)}</div>
          </button>
        )
      })}
    </div>
  )
}

export const FavoriteMarketButton = ({ market }) => {
  const [favoriteMarkets, setFavoriteMarkets] = useLocalStorageState(
    FAVORITE_MARKETS_KEY,
    []
  )

  const addToFavorites = (mkt) => {
    const newFavorites = [...favoriteMarkets, mkt]
    setFavoriteMarkets(newFavorites)
  }

  const removeFromFavorites = (mkt) => {
    setFavoriteMarkets(favoriteMarkets.filter((m) => m.name !== mkt.name))
  }

  return favoriteMarkets.find((mkt) => mkt.name === market.name) ? (
    <button onClick={() => removeFromFavorites(market)}>
      <FilledStarIcon className="h-4 text-th-primary w-4" />
    </button>
  ) : (
    <button
      className="default-transition text-th-fgd-4 hover:text-th-fgd-3"
      onClick={() => addToFavorites(market)}
    >
      <StarIcon className="h-4 w-4" />
    </button>
  )
}

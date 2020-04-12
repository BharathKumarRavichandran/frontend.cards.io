import React, { useState, useEffect, useCallback } from 'react'
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Tabs,
	Tab
} from '@material-ui/core'

import classes from './Declare.module.css'
import { literatureGameActions } from '../../state/actions/game.actions'
import { useDispatch, useSelector } from 'react-redux'
import { Friends } from './components/Friends'
import DisplayCards from './components/DisplayCards'
import * as LiteratureConstants from '../../constants'

const Declare = ({ open, handleClose }) => {
	const [suit, setSuit] = useState('H')
	const [avalaibleSuits, setAvailableSuits] = useState(
		LiteratureConstants.suits
	)
	const [cards, setCards] = useState([])
	const [order, setOrder] = useState(0)
	const [avalaibleOrders, setAvailableOrders] = useState(
		LiteratureConstants.orders
	)
	const [availableSets, setAvailableSets] = useState(LiteratureConstants.sets)

	const dispatch = useDispatch()
	const userCards = useSelector((state) => state.playerData.hand)
	const locked = useSelector((state) => state.locked)
	const user = useSelector((state) => state.playerData)
	const game = useSelector((state) => state.gameData)
	const friends = game.players.filter(
		(player) =>
			player.position !== user.position &&
			player.position % 2 === user.position % 2
	)
	const [selectedFriend, setselectedFriend] = useState(friends[0].position)

	useEffect(() => {
		const lowerRanks = ['2', '3', '4', '5', '6', '7']
		userCards.forEach((card) => {
			let cardValue = card[0]
			let cardSuit = card[1]
			if (lowerRanks.indexOf(cardValue) !== -1) {
				setAvailableOrders((previousOrders) => {
					return previousOrders.map((order) => {
						if (order.value === 0) order.present = true
						return order
					})
				})
				setAvailableSets((previousAvailableSets) => {
					let updatedAvailableSets = previousAvailableSets
					updatedAvailableSets['lower'] = updatedAvailableSets[
						'lower'
					].map((suit) => {
						if (suit.value === cardSuit) suit.present = true
						return suit
					})
					return updatedAvailableSets
				})
			} else {
				setAvailableOrders((previousOrders) => {
					return previousOrders.map((order) => {
						if (order.value === 6) order.present = true
						return order
					})
				})
				setAvailableSets((previousAvailableSets) => {
					let updatedAvailableSets = previousAvailableSets
					updatedAvailableSets['higher'] = updatedAvailableSets[
						'higher'
					].map((suit) => {
						if (suit.value === cardSuit) suit.present = true
						return suit
					})
					return updatedAvailableSets
				})
			}
		})
	}, [userCards])
	useEffect(() => {
		let ret = []
		for (let i = order; i < order + 6; i++) {
			if (userCards.indexOf(LiteratureConstants.ranks[i] + suit) === -1)
				ret.push({
					value: LiteratureConstants.ranks[i] + suit,
					assignedTo: ''
				})
		}
		ret = ret.filter((item) => userCards.indexOf(item.value) === -1)
		setCards(ret)
	}, [suit, order, userCards])
	useEffect(() => {
		if (order === 0) setAvailableSuits(availableSets['lower'])
		else setAvailableSuits(availableSets['higher'])
	}, [order, availableSets])

	const assign = (card) => {
		let prev = cards.map((item) => {
			if (card.value === item.value) item.assignedTo = selectedFriend
			return item
		})
		setCards(prev)
	}
	const declare = useCallback(() => {
		const nums = [
			'2',
			'3',
			'4',
			'5',
			'6',
			'7',
			'9',
			'10',
			'J',
			'Q',
			'K',
			'A'
		]
		if (cards.some((card) => card.assignedTo === '')) return
		else {
			let declaration = [[]]
			let last_num,
				j = 0
			for (let i = order; i < order + 6; i++) {
				if (userCards.indexOf(nums[i] + suit) !== -1)
					cards.push({
						value: nums[i] + suit,
						assignedTo: user.position
					})
			}
			cards.sort((a, b) => a.assignedTo - b.assignedTo)
			last_num = parseInt(cards[0].assignedTo)
			declaration[j].push(cards[0].value)
			for (let i = 1; i < cards.length; i++) {
				if (parseInt(cards[i].assignedTo) !== last_num) {
					declaration.push([])
					j++
					last_num = parseInt(cards[i].assignedTo)
				}
				declaration[j].push(cards[i].value)
			}
			dispatch(
				literatureGameActions.playDeclare({
					code: game.code,
					fid: user.id,
					declaration
				})
			)
		}
	}, [
		dispatch,
		cards,
		order,
		suit,
		game.code,
		userCards,
		user.position,
		user.id
	])

	return (
		<Dialog open={open} onExit={handleClose} className={classes.modal}>
			<DialogTitle>Declare cards</DialogTitle>
			<DialogContent>
				<p className={classes.p}>Select order</p>
				<Tabs
					value={order}
					classes={{
						flexContainer: classes.tabs
					}}
					onChange={(e, newVal) => setOrder(newVal)}
				>
					{avalaibleOrders.map((order) => {
						if (order.present)
							return (
								<Tab value={order.value} label={order.name} />
							)
						else return null
					})}
				</Tabs>
				<p className={classes.p}>Select suit</p>
				<Tabs
					value={suit}
					classes={{
						flexContainer: classes.tabs
					}}
					onChange={(e, newVal) => setSuit(newVal)}
				>
					{avalaibleSuits.map((suit) => {
						if (suit.present)
							return <Tab value={suit.value} label={suit.name} />
						else return null
					})}
				</Tabs>
				<p className={classes.p}>Select friend</p>
				<Friends
					selectedFriend={selectedFriend}
					setselectedFriend={setselectedFriend}
					classes={classes}
					friends={friends}
				/>
				<p className={classes.p}>Select cards</p>
				<DisplayCards
					classes={classes}
					cards={cards}
					onCardClick={assign}
				/>
			</DialogContent>
			<DialogActions>
				<Button
					variant="contained"
					color="secondary"
					onClick={handleClose}
				>
					Close
				</Button>
				<Button
					disabled={locked}
					color="primary"
					variant="contained"
					onClick={declare}
				>
					Declare
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default Declare

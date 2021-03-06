import React, { useState, useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { connect, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { useMediaQuery } from 'react-responsive'
import { gameActions } from '../../../game-engine/state/actions'

import GameRenderer from '../../../game-engine/components/pixi/renderer'
import GameView from '../../../game-engine/components/GameView/GameView'

import { Desktop, Mobile } from '../../../util/device'

import Declare from '../Declare'
import AskCard from '../AskCard/AskCard'
import Transfer from '../Transfer'
import LogDisplay from '../LogDisplay'
import GameOverRoom from '../../../game-engine/components/GameOverRoom'

import WaitingRoom from '../../../game-engine/components/WaitingRoom/WaitingRoom'
import LoaderModal from '../../../game-engine/components/LoaderModal/LoaderModal'
import DialogModal from '../../../game-engine/components/DialogModal/DialogModal'

import { logParser, addNotification } from '../../util'

import './GamePage.css'

import { makeStyles } from '@material-ui/core/styles'
import {
	AppBar,
	Button,
	Fab,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography
} from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu'
import {
	Navigation as NavigationIcon,
	VideogameAsset as VideogameAssetIcon,
	VolumeOff as VolumeOffIcon,
	VolumeUp as VolumeUpIcon
} from '@material-ui/icons'
import { ChatBox } from '../../../game-engine/components/ChatBox'

const useStyles = makeStyles((theme) => ({
	appBar: {
		flexGrow: 1,
		backgroundColor: 'rgb(0,0,0,0.7)',
		backdropFilter: 'blur(4px)'
	},
	scoreContainer: {
		flexGrow: 1
	},
	playerScore: {
		marginRight: theme.spacing(0.8),
		'&:hover': {
			cursor: 'pointer'
		}
	},
	opponentScore: {
		marginLeft: theme.spacing(0.8),
		'&:hover': {
			cursor: 'pointer'
		}
	},
	title: {
		flexGrow: 1
	},
	leaveButton: {
		color: theme.palette.error.main
	},
	actionsFab: {
		position: 'fixed',
		bottom: 30,
		right: 40
	},
	closeIcon: {
		padding: theme.spacing(0.5)
	}
}))

// Initialize Renderer
let renderer = new GameRenderer(),
	startedLoad = false,
	assetsLoaded = false
renderer.initRenderer()

window.onorientationchange = () => window.location.reload()

const GamePage = (props) => {
	const classes = useStyles()

	const [isAssetsLoaded, setIsAssetsLoaded] = useState(assetsLoaded)

	const [playerTeamScore, setPlayerTeamScore] = useState(0)
	const [opponentTeamScore, setOpponentTeamScore] = useState(0)

	const loadGameView = () => {
		assetsLoaded = true
		setIsAssetsLoaded(true)
	}

	// Load renderer assets
	if (!startedLoad) {
		renderer.loadRendererAssets(loadGameView)
		startedLoad = true
	}

	const isMobile = useMediaQuery({ maxDeviceWidth: 768 })

	// Game specifics
	const player = useSelector((state) => state.playerData)
	const game = useSelector((state) => state.gameData)
	const otherPlayers = useSelector((state) =>
		state.gameData.players.filter(
			(item) => item.position !== player.position
		)
	)
	const logs = useSelector((state) => state.gameData.logs)

	const [previousLogs, setPreviousLogs] = useState([])

	const [declareOpen, setDeclareOpen] = useState(false)
	const [askOpen, setAskOpen] = useState(false)
	const [transferOpen, setTransferOpen] = useState(false)
	const [logDisplayOpen, setLogDisplayOpen] = useState(false)
	const [abandonOpen, setAbandonOpen] = useState(false)
	const [errorOpen, setErrorOpen] = useState(false)
	const [actionsMenuOpen, setActionsMenuOpen] = useState(null)
	const [appBarMenuOpen, setAppBarMenuOpen] = useState(null)
	const [gameOver, setGameOver] = useState(false)
	const [winners, setWinners] = useState(0)

	const [previousModalOptions, setPreviousModalOptions] = useState({
		suit: 'H',
		order: 0,
		opponent: 0
	})

	const handleDeclareClose = () => {
		setDeclareOpen((prev) => !prev)
		setActionsMenuOpen(null)
	}

	const handleAskClose = () => {
		setAskOpen((prev) => !prev)
		setActionsMenuOpen(null)
	}

	const handleTransferClose = () => {
		setTransferOpen((prev) => !prev)
		setActionsMenuOpen(null)
	}

	const handleLogDisplayClose = () => {
		setLogDisplayOpen((prev) => !prev)
		setAppBarMenuOpen(null)
	}

	const handleGameOverClose = () => {
		renderer.resetRenderer()
		props.leaveGame(props.gameData.code, props.playerData.id)
		setGameOver(false)
	}

	const handleActionsFabClick = (event) => {
		setActionsMenuOpen(event.currentTarget)
	}

	const handleActionsMenuClose = () => {
		setActionsMenuOpen(null)
	}

	const handleAppBarMenuClick = (event) => {
		setAppBarMenuOpen(event.currentTarget)
	}

	const handleAppBarMenuClose = () => {
		setAppBarMenuOpen(null)
	}

	const handleClickRetry = () => {
		window.location.reload()
	}

	const handleClickAbandonGame = () => {
		setAbandonOpen(true)
	}

	const handleCloseAbandonDialog = () => {
		setAbandonOpen(false)
	}

	const handleClickErrorLeave = () => {
		renderer.resetRenderer()
		props.errorLeaveGame()
	}

	const handleClickLeave = () => {
		renderer.resetRenderer()
		props.leaveGame(props.gameData.code, props.playerData.id)
	}

	const handleClickRules = () => {
		window.open('/rules/literature', '_blank')
	}

	useEffect(() => {
		// Add renderer to game page
		document.body.appendChild(renderer.app.view)

		// Add component specific general tag classnames
		document.body.classList.add('game-page')
		if (document.getElementsByTagName('canvas')[0])
			document
				.getElementsByTagName('canvas')[0]
				.classList.add('game-canvas')

		const updateScore = (gameData, playerData) => {
			let evenScore = 0
			let oddScore = 0

			gameData.players.forEach((player, index) => {
				if (player.position % 2 === 0) evenScore += player.score
				else oddScore += player.score
			})

			if (playerData.position % 2 === 0) {
				setPlayerTeamScore(evenScore)
				setOpponentTeamScore(oddScore)
			} else {
				setPlayerTeamScore(oddScore)
				setOpponentTeamScore(evenScore)
			}
		}

		if (props.error) setErrorOpen(true)
		updateScore(props.gameData, props.playerData)

		// Remove all component specifics on component unmount
		return () => {
			document.body.classList.remove('game-page')
			document
				.getElementsByTagName('canvas')[0]
				.classList.remove('game-canvas')
		}
	}, [props.error, props.gameData, props.playerData, isMobile])

	const checkArrayIdentical = (a, b) => {
		if (!a || !b) return false
		var i = a.length
		if (i !== b.length) return false
		while (i--) {
			if (a[i] !== b[i]) return false
		}
		return true
	}

	useEffect(() => {
		if (!checkArrayIdentical(logs, previousLogs)) {
			setPreviousLogs(logs)
			if (logs && logs.length) {
				let parsedLog = logParser(logs[0])
				if (parsedLog.title !== 'GameOver') {
					addNotification(
						parsedLog.title,
						parsedLog.message,
						parsedLog.type,
						props.mute
					)
				} else {
					let winnerTeam = parseInt(parsedLog.message)
					let winners = game.players.filter((player) => {
						return player.position % 2 === winnerTeam
					})
					setWinners(winners)
					setGameOver(true)
				}
			}
		}
	}, [
		logs,
		previousLogs,
		game.players,
		player.position,
		playerTeamScore,
		opponentTeamScore,
		props.mute
	])

	return (
		<>
			{localStorage.getItem('gameCode') ? (
				<>
					{props.inGame ? (
						<div>
							{!props.gameData.isActive ? (
								<WaitingRoom
									players={props.gameData.players}
									gameCode={props.gameData.code}
									gameOwner={props.gameData.owner}
									error={props.error}
									minPlayers={props.gameData.minPlayers}
									playerData={props.playerData}
									renderer={renderer}
								/>
							) : !gameOver ? (
								<>
									<AppBar
										position="sticky"
										className={classes.appBar}
									>
										<Toolbar variant="dense">
											<Desktop>
												<Typography
													className={
														classes.scoreContainer
													}
												>
													<Typography
														variant="inherit"
														className={
															classes.playerScore
														}
													>
														{playerTeamScore}
													</Typography>
													<Typography variant="inherit">
														:
													</Typography>
													<Typography
														variant="inherit"
														className={
															classes.opponentScore
														}
													>
														{opponentTeamScore}
													</Typography>
												</Typography>
												<Typography
													variant="h6"
													className={classes.title}
												>
													LITERATURE
												</Typography>
												<IconButton
													onClick={props.toggleMute}
													color="inherit"
												>
													{props.mute ? (
														<VolumeOffIcon />
													) : (
														<VolumeUpIcon />
													)}
												</IconButton>
												<Button
													color="inherit"
													onClick={handleClickRules}
												>
													Rules
												</Button>
												<Button
													color="inherit"
													onClick={
														handleLogDisplayClose
													}
												>
													Logs
												</Button>
												<Button
													color="inherit"
													onClick={
														handleClickAbandonGame
													}
												>
													Abandon Game
												</Button>
											</Desktop>
											<Mobile>
												<Typography
													className={
														classes.scoreContainer
													}
												>
													<Typography
														variant="inherit"
														className={
															classes.playerScore
														}
													>
														{playerTeamScore}
													</Typography>
													<Typography variant="inherit">
														:
													</Typography>
													<Typography
														variant="inherit"
														className={
															classes.opponentScore
														}
													>
														{opponentTeamScore}
													</Typography>
												</Typography>
												<Typography
													variant="h6"
													className={classes.title}
												>
													LITERATURE
												</Typography>
												<IconButton
													onClick={props.toggleMute}
													color="inherit"
												>
													{props.mute ? (
														<VolumeUpIcon />
													) : (
														<VolumeOffIcon />
													)}
												</IconButton>
												<IconButton
													color="inherit"
													aria-label="open drawer"
													onClick={
														handleAppBarMenuClick
													}
													edge="start"
												>
													<MenuIcon />
												</IconButton>
												<Menu
													id="simple-menu"
													anchorEl={appBarMenuOpen}
													keepMounted
													open={Boolean(
														appBarMenuOpen
													)}
													onClose={
														handleAppBarMenuClose
													}
												>
													<MenuItem
														onClick={
															handleClickRules
														}
													>
														Rules
													</MenuItem>
													<MenuItem
														onClick={
															handleLogDisplayClose
														}
													>
														Logs
													</MenuItem>
													<MenuItem
														onClick={
															handleClickAbandonGame
														}
													>
														Abandon Game
													</MenuItem>
												</Menu>
											</Mobile>
										</Toolbar>
									</AppBar>

									<Fab
										variant="extended"
										color="primary"
										aria-label="add"
										className={classes.actionsFab}
										disabled={
											game.currentTurn !== player.position
										}
										onClick={handleActionsFabClick}
									>
										<Desktop>
											<NavigationIcon
												className={classes.extendedIcon}
											/>
											Actions
										</Desktop>
										<Mobile>
											<VideogameAssetIcon />
										</Mobile>
									</Fab>
									<Menu
										id="simple-menu"
										anchorEl={actionsMenuOpen}
										keepMounted
										open={Boolean(actionsMenuOpen)}
										onClose={handleActionsMenuClose}
									>
										<MenuItem onClick={handleAskClose}>
											Ask Card
										</MenuItem>
										<MenuItem onClick={handleDeclareClose}>
											Declare a set
										</MenuItem>
										<MenuItem onClick={handleTransferClose}>
											Transfer Turn
										</MenuItem>
									</Menu>

									<DialogModal
										open={abandonOpen}
										title={
											'Are you sure you want to abandon the game?'
										}
										content={''}
										actionButtons={[
											<Button
												key={0}
												className={classes.leaveButton}
												onClick={handleClickLeave}
											>
												Leave
											</Button>,
											<Button
												key={1}
												color="primary"
												onClick={
													handleCloseAbandonDialog
												}
											>
												Close
											</Button>
										]}
									/>

									{isAssetsLoaded ? (
										<GameView
											renderer={renderer}
											others={otherPlayers}
											player={props.playerData}
											currentTurn={
												props.gameData.currentTurn
											}
											disabled
										/>
									) : null}

									{declareOpen && (
										<Declare
											open={declareOpen}
											previousOptions={
												previousModalOptions
											}
											setPreviousOptions={
												setPreviousModalOptions
											}
											handleClose={handleDeclareClose}
										/>
									)}
									{askOpen && (
										<AskCard
											open={askOpen}
											previousOptions={
												previousModalOptions
											}
											setPreviousOptions={
												setPreviousModalOptions
											}
											handleClose={handleAskClose}
										/>
									)}
									{transferOpen && (
										<Transfer
											open={transferOpen}
											handleClose={handleTransferClose}
										/>
									)}
									{logDisplayOpen && (
										<LogDisplay
											open={logDisplayOpen}
											handleClose={handleLogDisplayClose}
										/>
									)}
								</>
							) : (
								<GameOverRoom
									players={winners}
									handleClose={handleGameOverClose}
								/>
							)}
							<ChatBox />
						</div>
					) : (
						<>
							<LoaderModal show={!errorOpen} />
							<DialogModal
								open={errorOpen}
								title={'Uh-oh, something went wrong.'}
								content={props.error ? props.error.message : ''}
								actionButtons={[
									<Button
										key={0}
										color="primary"
										onClick={handleClickRetry}
									>
										Retry
									</Button>,
									<Button
										key={1}
										className={classes.leaveButton}
										onClick={handleClickErrorLeave}
									>
										Leave
									</Button>
								]}
							/>
						</>
					)}
				</>
			) : (
				<Redirect to="/home" />
			)}
		</>
	)
}

GamePage.propTypes = {
	gameData: PropTypes.object.isRequired,
	cardSelected: PropTypes.object,
	playerData: PropTypes.object,
	inGame: PropTypes.bool.isRequired,
	error: PropTypes.object
}

const mapStateToProps = (state) => {
	return {
		gameData: state.gameData,
		error: state.error,
		cardSelected: state.cardSelected,
		playerData: state.playerData,
		inGame: state.inGame,
		mute: state.mute,
		locked: state.locked
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		leaveGame: (code, pid) =>
			dispatch(gameActions.leaveGameRequest(code, pid)),
		errorLeaveGame: (response) =>
			dispatch(gameActions.leaveGameSuccess(response)),
		toggleMute: (response) => dispatch(gameActions.toggleMute())
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(GamePage)

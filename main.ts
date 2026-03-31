#!/usr/bin/env node
import { generateSoul, roll } from './companion.ts'
import { renderFace, renderSprite, spriteFrameCount } from './sprites.ts'
import {
  RARITY_COLORS,
  RARITY_STARS,
  SPECIES,
  type Species,
} from './types.ts'

const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const ITALIC = '\x1b[3m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const MAGENTA = '\x1b[35m'
const RED = '\x1b[31m'
const WHITE = '\x1b[37m'
function formatDate(ts: number): string {
  return new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
}

function hashToTimestamp(userId: string): number {
  let h = 2166136261
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const days = h >>> 0
  return Date.UTC(2026, 3, 1) + (days % 365) * 24 * 60 * 60 * 1000
}

// ─── Stat bar renderer ────────────────────────────────
function statBar(value: number, width = 20): string {
  const filled = Math.round((value / 100) * width)
  const empty = width - filled
  const color =
    value >= 80 ? GREEN : value >= 50 ? YELLOW : value >= 25 ? MAGENTA : RED
  return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`
}

// ─── Card renderer ────────────────────────────────────
function renderCard(userId: string): string[] {
  const { bones } = roll(userId)
  const soul = generateSoul(userId, bones.species)
  const rarityColor = RARITY_COLORS[bones.rarity]
  const stars = RARITY_STARS[bones.rarity]
  const sprite = renderSprite(bones, 0)
  const face = renderFace(bones)
  const hatchedAt = hashToTimestamp(userId)

  const lines: string[] = []

  // Top border
  lines.push(`${rarityColor}╔${'═'.repeat(46)}╗${RESET}`)

  // Title
  const speciesName = bones.species.charAt(0).toUpperCase() + bones.species.slice(1)
  const title = `${bones.shiny ? '✨ SHINY ' : ''}${speciesName}`
  const titlePad = 46 - title.length - stars.length - (bones.shiny ? 0 : 0)
  lines.push(
    `${rarityColor}║${RESET} ${BOLD}${rarityColor}${title}${RESET}${' '.repeat(Math.max(1, titlePad))}${rarityColor}${stars}${RESET} ${rarityColor}║${RESET}`,
  )

  // Separator
  lines.push(`${rarityColor}╠${'═'.repeat(46)}╣${RESET}`)
  lines.push(
    `${rarityColor}║${RESET} ${BOLD}${soul.name}${RESET}${' '.repeat(Math.max(0, 45 - soul.name.length))}${rarityColor}║${RESET}`,
  )
  lines.push(
    `${rarityColor}║${RESET} ${ITALIC}${soul.personality}${RESET}${' '.repeat(Math.max(0, 45 - soul.personality.length))}${rarityColor}║${RESET}`,
  )
  lines.push(`${rarityColor}╠${'═'.repeat(46)}╣${RESET}`)

  // Sprite + Stats side by side
  const statEntries = Object.entries(bones.stats)
  const maxLines = Math.max(sprite.length, statEntries.length + 2)

  for (let i = 0; i < maxLines; i++) {
    const spriteLine = i < sprite.length ? sprite[i]! : '            '
    let rightSide = ''

    if (i === 0) {
      rightSide = `${DIM}Eye: ${RESET}${bones.eye}  ${DIM}Hat: ${RESET}${bones.hat === 'none' ? '-' : bones.hat}`
    } else if (i === 1) {
      rightSide = `${DIM}Face: ${RESET}${face}`
    } else if (i - 2 < statEntries.length) {
      const [name, value] = statEntries[i - 2]!
      const label = name!.padEnd(10)
      rightSide = `${DIM}${label}${RESET}${statBar(value as number)} ${WHITE}${String(value).padStart(3)}${RESET}`
    }

    // Pad sprite to fixed width, then add right side
    const paddedSprite = spriteLine.padEnd(14)
    lines.push(
      `${rarityColor}║${RESET} ${rarityColor}${paddedSprite}${RESET}${rightSide.padEnd(50)}${rarityColor}║${RESET}`,
    )
  }

  // Rarity line
  const rarityLabel = bones.rarity.toUpperCase()
  lines.push(`${rarityColor}╠${'═'.repeat(46)}╣${RESET}`)
  const raritySuffix = bones.shiny ? ` ${YELLOW}✨ SHINY${RESET}` : ''
  lines.push(
    `${rarityColor}║${RESET} ${BOLD}${rarityColor}${rarityLabel}${RESET}${raritySuffix}${' '.repeat(Math.max(0, 45 - rarityLabel.length - (bones.shiny ? 8 : 0)))}${rarityColor}║${RESET}`,
  )
  lines.push(
    `${rarityColor}║${RESET} ${DIM}Hatched:${RESET} ${formatDate(hatchedAt)}${' '.repeat(Math.max(0, 24 - formatDate(hatchedAt).length))}${rarityColor}║${RESET}`,
  )

  // Bottom border
  lines.push(`${rarityColor}╚${'═'.repeat(46)}╝${RESET}`)

  return lines
}

// ─── Animation renderer ───────────────────────────────
function renderAnimation(userId: string): void {
  const { bones } = roll(userId)
  const rarityColor = RARITY_COLORS[bones.rarity]
  const frameCount = spriteFrameCount(bones.species)
  let frame = 0
  const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 2, 0, 0, 0]
  let tick = 0

  // Hide cursor
  process.stdout.write('\x1b[?25l')

  const timer = setInterval(() => {
    const step = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!
    let blink = false
    if (step === -1) {
      frame = 0
      blink = true
    } else {
      frame = step % frameCount
    }

    const sprite = renderSprite(bones, frame).map((line) =>
      blink ? line.replaceAll(bones.eye, '-') : line,
    )

    // Move cursor up and redraw
    if (tick > 0) {
      process.stdout.write(`\x1b[${sprite.length + 1}A`)
    }

    for (const line of sprite) {
      process.stdout.write(`  ${rarityColor}${line}${RESET}\x1b[K\n`)
    }
    process.stdout.write(
      `  ${DIM}(tick ${tick}, frame ${frame}${blink ? ', blink' : ''})${RESET}\x1b[K\n`,
    )

    tick++
  }, 500)

  // Cleanup on exit
  const cleanup = () => {
    clearInterval(timer)
    process.stdout.write('\x1b[?25h\n') // Show cursor
    process.exit(0)
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

// ─── Gallery: show all 18 species ─────────────────────
function renderGallery(): void {
  console.log(`\n${BOLD}${CYAN}  ═══ BUDDY SPECIES GALLERY ═══${RESET}\n`)

  for (const species of SPECIES) {
    // Use species name as seed to get a deterministic companion per species
    const { bones } = roll(`gallery-${species}`)
    // Override species to show each one
    const displayBones = { ...bones, species: species as Species }
    const sprite = renderSprite(displayBones, 0)
    const face = renderFace(displayBones)
    const rarityColor = RARITY_COLORS[displayBones.rarity]

    const name = species.charAt(0).toUpperCase() + species.slice(1)
    console.log(`  ${rarityColor}${BOLD}${name}${RESET} ${DIM}${face}${RESET}`)
    for (const line of sprite) {
      console.log(`  ${rarityColor}${line}${RESET}`)
    }
    console.log()
  }
}

// ─── Gacha: roll multiple companions ──────────────────
function renderGacha(count: number): void {
  console.log(
    `\n${BOLD}${YELLOW}  ═══ BUDDY GACHA ×${count} ═══${RESET}\n`,
  )

  for (let i = 0; i < count; i++) {
    const userId = `gacha-${Date.now()}-${i}-${Math.random()}`
    const card = renderCard(userId)
    for (const line of card) {
      console.log(`  ${line}`)
    }
    console.log()
  }
}

function renderInspect(userId: string): void {
  const { bones, inspirationSeed } = roll(userId)
  const soul = generateSoul(userId, bones.species)
  const payload = {
    userId,
    soul,
    bones,
    inspirationSeed,
    hatchedAt: formatDate(hashToTimestamp(userId)),
  }

  console.log(JSON.stringify(payload, null, 2))
}

// ─── Main ─────────────────────────────────────────────
function main(): void {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  switch (command) {
    case 'hatch': {
      const userId = args[1] || `user-${Date.now()}`
      console.log(
        `\n${DIM}  Hatching companion for: ${RESET}${BOLD}${userId}${RESET}\n`,
      )
      const card = renderCard(userId)
      for (const line of card) {
        console.log(`  ${line}`)
      }
      console.log()
      break
    }

    case 'animate': {
      const userId = args[1] || `user-${Date.now()}`
      const { bones } = roll(userId)
      const name =
        bones.species.charAt(0).toUpperCase() + bones.species.slice(1)
      console.log(
        `\n${DIM}  Animating: ${RESET}${BOLD}${RARITY_COLORS[bones.rarity]}${name}${RESET} ${DIM}(Ctrl+C to stop)${RESET}\n`,
      )
      renderAnimation(userId)
      break
    }

    case 'gallery': {
      renderGallery()
      break
    }

    case 'gacha': {
      const count = parseInt(args[1] || '5', 10)
      renderGacha(count)
      break
    }

    case 'lookup': {
      const userId = args[1]
      if (!userId) {
        console.log(`${RED}  Usage: buddy lookup <userId>${RESET}`)
        break
      }
      console.log(
        `\n${DIM}  Looking up companion for: ${RESET}${BOLD}${userId}${RESET}\n`,
      )
      const card = renderCard(userId)
      for (const line of card) {
        console.log(`  ${line}`)
      }
      console.log(
        `\n${DIM}  (Same userId always produces the same companion)${RESET}\n`,
      )
      break
    }

    case 'inspect': {
      const userId = args[1]
      if (!userId) {
        console.log(`${RED}  Usage: buddy inspect <userId>${RESET}`)
        break
      }
      renderInspect(userId)
      break
    }

    case 'help':
    default: {
      console.log(`
${BOLD}${CYAN}  ╔═══════════════════════════════════════╗
  ║        🐣 BUDDY Standalone Demo       ║
  ╚═══════════════════════════════════════╝${RESET}

  ${BOLD}Usage:${RESET}  node buddy-standalone/main.ts <command> [args]

  ${BOLD}Commands:${RESET}

    ${GREEN}hatch${RESET} [userId]      Hatch a companion (random or by userId)
    ${GREEN}lookup${RESET} <userId>     Look up a specific user's companion
    ${GREEN}inspect${RESET} <userId>    Print deterministic raw data as JSON
    ${GREEN}animate${RESET} [userId]    Show idle animation (Ctrl+C to stop)
    ${GREEN}gallery${RESET}             Display all 18 species
    ${GREEN}gacha${RESET} [count]       Roll multiple random companions (default: 5)
    ${GREEN}help${RESET}                Show this help

  ${BOLD}Examples:${RESET}

    ${DIM}node buddy-standalone/main.ts hatch${RESET}
    ${DIM}node buddy-standalone/main.ts hatch my-email@example.com${RESET}
    ${DIM}node buddy-standalone/main.ts inspect alice${RESET}
    ${DIM}node buddy-standalone/main.ts animate${RESET}
    ${DIM}node buddy-standalone/main.ts gallery${RESET}
    ${DIM}node buddy-standalone/main.ts gacha 10${RESET}
`)
      break
    }
  }
}

main()

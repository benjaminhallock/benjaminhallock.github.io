#!/usr/bin/env node
'use strict'

/**
 * Create a post from the command line — the same thing the studio button does.
 *
 *   npm run new -- "Title of the post" --file body.html --tags "web, notes" --push
 *   echo "<p>Hello.</p>" | npm run new -- "Hello"
 *
 * Flags:
 *   --file <path>    read the body from a file instead of stdin
 *   --excerpt <text> meta description
 *   --tags <a,b>     comma separated tags
 *   --date <iso>     YYYY-MM-DD, defaults to today
 *   --push           push to origin after committing
 *   --dry-run        render the HTML and print it, write nothing
 */

const fs = require('fs')
const path = require('path')
const { createPost, PostError } = require('./lib/post')

function parseArgs (argv) {
  const flags = {}
  const rest = []

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--push' || arg === '--dry-run') {
      flags[arg.slice(2)] = true
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const value = argv[i + 1]
      if (value === undefined || value.startsWith('--')) {
        throw new PostError(`--${key} needs a value.`)
      }
      flags[key] = value
      i++
    } else {
      rest.push(arg)
    }
  }

  return { flags, title: rest.join(' ').trim() }
}

function readStdin () {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function main () {
  const { flags, title } = parseArgs(process.argv.slice(2))

  if (!title) {
    console.error(`
  Usage: npm run new -- "Post title" [options]

    --file <path>     read the body from a file (otherwise stdin)
    --excerpt <text>  meta description
    --tags <a,b>      comma separated tags
    --date <iso>      YYYY-MM-DD, defaults to today
    --push            push to origin after committing
    --dry-run         print the HTML, write nothing

  Examples:
    npm run new -- "Notes on caching" --file post.html --tags "web, notes" --push
    echo "<p>Hello.</p>" | npm run new -- "Hello"
`)
    process.exit(1)
  }

  const content = flags.file ? fs.readFileSync(path.resolve(flags.file), 'utf8') : readStdin()
  if (!content.trim()) {
    console.error('\n  No body given. Pass --file <path> or pipe the HTML in on stdin.\n')
    process.exit(1)
  }

  const result = createPost({
    title,
    content,
    excerpt: flags.excerpt || '',
    tags: flags.tags || '',
    date: flags.date || '',
    push: Boolean(flags.push),
    dryRun: Boolean(flags['dry-run']),
  })

  if (result.dryRun) {
    process.stdout.write(result.html)
    return
  }

  console.log(`
  Created   ${result.file}
  Date      ${result.date}
  Commit    ${result.commit}
  Staged    ${result.staged.join(', ')}
  Pushed    ${result.pushed ? 'yes' : 'no'}${result.pushError ? ` — ${result.pushError}` : ''}
`)

  if (result.pushError) process.exitCode = 1
}

try {
  main()
} catch (err) {
  if (err instanceof PostError) {
    console.error(`\n  ${err.message}\n`)
    process.exit(1)
  }
  throw err
}

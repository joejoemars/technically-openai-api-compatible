# Technically OpenAI API Compatible
<sup>or SSLCI</suop>

**NOTE!** I am not responsible for anything that happens from you using any of this code! I did this over the course of like 12 hours and the code quality is a testament to that.

## What is this?
I got bored and wanted to make something for dealing with LLM calls *in the browser*. This does what I want and I made a UI around it. Svelte ftw. Though recent updates have made it more annoying every now and again.

## Why not use an already made package?
That's boring. Besides, if I wanted something good I wouldn't be making it myself! Har har.

## Will `llm-funcs.ts` get made into an npm package?
Unlikely! I'm probably gonna put it into it's own repo to track changes if I start making lots of modifications to it but I might keep that specific repo private.

## I found a problem!
Cool! I don't have anything else to say. This was a random project. You could make an issue I guess but don't plan on me ever acting on it.

## You're not sanitizing the output!
I know! I don't really care. If you somehow compromise an API key through this app,that's entirely on you. If you get pwned through this app, you shouldn't be allowed to exist near critical infrastructure because that would be a momumental fumble.

## Can I use the code in here?
Sure! Everything I wrote I have decided to release as GPLv3. However, I strongly recommend you don't learn from my code. There's several issues and lots of things are... Messy to say the least. And probably not secure.

## How do I run this?
Clone the repo, install the dependencies with the package manager of your choice, and run. I use pnpm.

After cloning the repo, you basically just cd into the folder and do:

`pnpm install`

`pnpm run dev`

And it should now be running!

## Was this vibe-coded?
Kinda yes, but pretty much no. The response streaming in `llm-funcs.ts` was I *think* originally conjured up by Gemini? And of course a lot of google searches where I glanced at the AI overview. Though all the svelte code was made by me. Tragically made all by me. Same for most of `llm-funcs.ts`, really only the response streaming was AI generated directly before being thoroughly edited across like, 4 projects.

What you see here is mostly natural human made garbage!

## How are you deploying this?
On a Steamdeck that lives at the foot of my bed. I wish I was joking. It's not containerized, just running `node ./` in the build output and piping it through cloudflared to a subdomain. This is a very fragile setup...
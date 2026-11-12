*[Lee esta guía en español](https://warasoft.com/es/blog/reels-con-claude-skills/)*

At Warasoft we have been producing reels for several Instagram accounts for weeks without opening a video editor. We ask **Claude Code** "make me a reel about…", and it writes the script, generates the voice, draws and animates every scene, adds word-by-word captions, mixes the music and delivers an MP4 ready to upload.

That method lives in two **skills**, and today we are releasing them for free. This guide shows what each one does, real examples of the videos they produce, and how to install them on your computer step by step.

## What is a Claude skill?

A *skill* is a folder of instructions, scripts and templates that Claude Code loads when a task calls for it. Think of it as handing Claude the manual for a craft: instead of explaining how you want your videos every time, the skill already knows the format, the rules that make a reel hold attention, and the steps to produce it end to end.

Ours install as a Claude Code **plugin** from a public GitHub repository. Learn more in the [official skills documentation](https://code.claude.com/docs/en/skills).

## The two skills

<div style="overflow-x:auto;margin:24px 0"><table style="width:100%;border-collapse:collapse;font-size:.95rem;line-height:1.5"><thead><tr><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"></th><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"><strong>reel-vectorial</strong></th><th style="text-align:left;padding:12px 14px;background:#f7f8fa;border-bottom:2px solid #e8eaef"><strong>reel-diorama</strong></th></tr></thead><tbody><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Style</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Everything drawn in code: characters, sets, neon diagrams and animated numbers</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Night-time 3D dioramas with mannequins, AI-generated and explored by a 2.5D camera</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>How scenes are made</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">SVG and HTML inside Remotion. No image generator</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Z-Image Turbo generates each shot on your Mac and Depth Pro extracts the depth</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Examples</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><a href="https://www.instagram.com/datorarito/">@datorarito</a> and <a href="https://www.instagram.com/_rafaelarango/">@_rafaelarango</a></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><a href="https://www.instagram.com/sal.delarueda/">@sal.delarueda</a></td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Computer</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Any recent Mac (also Linux, or Windows via WSL)</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Apple Silicon Mac, 32 GB of memory recommended</td></tr><tr><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef"><strong>Best for</strong></td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Fun facts, explainers, education, personal brand</td><td style="vertical-align:top;padding:12px 14px;border-bottom:1px solid #e8eaef">Economics, personal finance, stories built on visual metaphors</td></tr></tbody></table></div>

![Reels made with reel-vectorial](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/galeria-vectorial.webp)

![Reels made with reel-diorama](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/galeria-diorama.webp)

Both produce the same format: 1080×1920 vertical video at 30 fps, 35 to 55 seconds long, with large word-by-word captions and the key word highlighted in color. The skills themselves are written in Spanish, and Claude follows them in whatever language you write to it.

## How it works under the hood

![The six steps of a video](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/flujo.webp)

1. **Script.** Claude writes a script with the formula that has worked best for us:
    - a **question hook** with something odd already on screen from the very first frame;
    - the answer lands between 65 % and 80 % of the video;
    - the last shot returns to the first, so the reel loops.

    It shows you the script and **waits for your approval** before going on.

2. **Voice.** Generated with [ElevenLabs](https://elevenlabs.io), with per-word timings to sync captions and cuts. If you don't have a key yet, a **simulated voice** lets you build the whole video without spending credits. Then Whisper "listens" to the audio and flags any word the voice swallowed.
3. **Scenes.** Every sentence is illustrated exactly when it is heard. In vectorial, Claude draws sets with light, depth and a character who acts. In diorama, it writes the prompt for each shot and generates it on your computer.
4. **Editing.** Cuts land on the word that carries weight, no shot lasts more than 2.5 seconds and something changes on screen every 1–2 seconds. Only low sound effects are used, each tied to a visual hit.
5. **Review.** Claude exports frames from every shot plus a contact sheet, looks at them and fixes whatever wouldn't survive a screenshot.
6. **Render.** A task queue keeps the computer from overloading. Audio is mastered to −14 LUFS, and you get the video, a light version for your phone and the cover. You approve the draft before it moves to "final".

## Requirements

- **[Claude Code](https://code.claude.com/docs/en/quickstart)**, in the terminal or in the Code tab of the Claude desktop app.
- **Node.js 20+**, **Python 3.10+** and **ffmpeg**.
- **For reel-vectorial:** any recent Mac. It also runs on Linux, and on Windows through WSL.
- **For reel-diorama:**
    - an Apple Silicon Mac with **32 GB of memory** (24 GB is tight; we don't recommend 16 GB);
    - about **45 GB free** for the image models.

- **Optional:**
    - an ElevenLabs API key for the voice; without one you can build everything with the simulated voice;
    - Google Chrome, because if it's missing, Remotion downloads its own browser.

## Step-by-step installation

![Installing the skills in Claude Code](https://cdn.jsdelivr.net/gh/rafacu-dev/warasoft-reels@main/docs/img/instalar.webp)

**1. Create a folder for your reels and open Claude Code in it.**

```bash
mkdir my-reels && cd my-reels
claude
```

**2. Add our plugin catalog** (first time only):

```text
/plugin marketplace add rafacu-dev/warasoft-reels
```

**3. Install the skill you want, or both:**

```text
/plugin install reel-vectorial@warasoft-reels
/plugin install reel-diorama@warasoft-reels
```

Claude Code asks for a scope: choose **"Install for you"** to have them in every project. Then, when you type `/`, you'll see `/reel-vectorial:reel-vectorial` and `/reel-diorama:reel-diorama`.

**4. Set up your first account.** Ask in your own words:

> Set up the reel-vectorial kit for my account @my.brand

Claude creates `cuentas/my-brand/` with:

- the Remotion project;
- the scripts;
- a demo video, so you can see the format before spending anything.

Then it asks what defines your brand: colors, kind of character, music and call to action.

**5. reel-diorama only: set up the image generator.** It's a single command that installs the environment and downloads the models (Z-Image Turbo and Depth Pro). Ask Claude ("set up the reel-diorama image environment") or run the skill's `preparar-entorno.sh` script. The first run takes a while.

**6. (Optional) Add your ElevenLabs key.** It goes in the account project's `.env` file, never in the chat. Claude tells you where the file is and never reads or prints it.

**7. Ask for your first video:**

> Make me a 40-second reel for @my.brand about why coffee doesn't stop you from feeling sleepy

Claude writes the script and waits for your approval. Then it produces the video and leaves the draft in `videos/borradores/`.

**Prefer a manual install?** Clone the [repository](https://github.com/rafacu-dev/warasoft-reels) and copy the skill folder (`plugins/reel-vectorial/skills/reel-vectorial`) into `~/.claude/skills/`. Full documentation is in the [README](https://github.com/rafacu-dev/warasoft-reels#readme).

## Examples and channels for inspiration

**Made with these skills:**

- [@datorarito](https://www.instagram.com/datorarito/): quick fun facts, 100 % vector.
- [@sal.delarueda](https://www.instagram.com/sal.delarueda/): money and economics with night-time dioramas.
- [@_rafaelarango](https://www.instagram.com/_rafaelarango/): personal brand, with the founder's poses cut out over code-drawn graphics.

**Accounts and channels that inspired us:**

- [@bolsaolavida](https://www.instagram.com/bolsaolavida/), on Instagram: finance explained with 3D scenes.
- [@resultaaquee](https://www.instagram.com/resultaaquee/), on Instagram: fast-paced animated fun facts.
- [@javiernegocios.online](https://www.instagram.com/javiernegocios.online/), on Instagram: the creator acts out poses over animated graphics.
- [Kurzgesagt – In a Nutshell](https://www.youtube.com/@kurzgesagt), on YouTube: the benchmark for explanatory vector motion graphics.
- [Remotion Showcase](https://www.remotion.dev/showcase): videos made with code, the same technology we use.

## Licenses and good practice

- **The skills** are free and open source (MIT license).
- **Remotion**, the video engine, is free for individuals and companies of up to 3 people. Others need a [company license](https://www.remotion.dev/license).
- **The reel-diorama models** are open too:
    - Z-Image Turbo, under Apache 2.0;
    - Depth Pro, under Apple's license;
    - mflux, under MIT.

- **Voice** from a free ElevenLabs plan can't be used commercially. If you plan to monetize, use a paid plan.
- **The recommended music** is by Kevin MacLeod ([incompetech.com](https://incompetech.com)) under CC BY: credit it in the caption.
- **Label the reel as "AI content"** on Instagram when the voice or images are generated.
- **Check your facts.** The skills ask for primary sources for every claim. A fun-facts account lives on its credibility.
- **Don't clone other people's voices** without their permission.

## FAQ

### Do I need to know how to code?
No. You talk to Claude in plain language and it writes and runs the code. It helps not to fear the terminal: it's three commands.

### How much does it cost?
The skills are free. You need a Claude subscription that includes Claude Code and, for a real voice, an ElevenLabs plan. reel-diorama images are generated on your Mac, with no per-image cost.

### How long does a video take?
What takes longest is your review of the script. The rest depends on your computer: a vector reel renders in minutes, and a diorama reel takes longer because it generates the images locally.

### Does it work on Windows or Linux?
reel-vectorial runs on macOS, on Linux, and on Windows through WSL. We've tested it thoroughly on Mac. reel-diorama needs an Apple Silicon Mac, because it generates images with MLX.

### Can I use it for my business?
Yes, within the licenses above: Remotion according to your company size, a paid voice plan for commercial use, and music attribution.

---

Want us to set this system up for your business, or make reels about your products? [Email us at contact@warasoft.com](mailto:contact@warasoft.com) and tell us your idea. And to see how we keep improving it, follow [@_rafaelarango](https://www.instagram.com/_rafaelarango/) on Instagram.

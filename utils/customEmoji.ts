const BLOB_BASE_URL = '/emoji/blob'
const MEOW_BASE_URL = '/emoji/meow'
const FROGE_BASE_URL = '/emoji/froge'
const PARROT_BASE_URL = '/emoji/parrots'
const SHIBLOB_BASE_URL = '/emoji/shiblob'
const YOYO_BASE_URL = '/emoji/yoyo'

export const BLOB_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  ':blob-thumbs-up:': { file: 'blob-thumbs-up-gif.gif', label: '+1' },
  ':blob-thumbs-down:': { file: 'blob-thumbs-down-gif.gif', label: '-1' },
  ':blob-heart:': { file: 'blob-heart.png', label: 'heart' },
  ':blob-love:': { file: 'blob-love-gif.gif', label: 'love' },
  ':blob-tada:': { file: 'blob-tada-gif.gif', label: 'tada' },
  ':blob-thinking:': { file: 'blob-thinking-gif.gif', label: 'thinking' },
  ':blob-cry:': { file: 'blob-cry-gif.gif', label: 'cry' },
  ':blob-happy:': { file: 'blob-happy-gif.gif', label: 'happy' },
  ':blob-hype:': { file: 'blob-hype-gif.gif', label: 'hype' },
  ':blob-wave:': { file: 'blob-wave-gif.gif', label: 'wave' },
  ':blob-hug:': { file: 'blob-hug.png', label: 'hug' },
  ':blob-100:': { file: 'blob-100-gif.gif', label: '100' },
  ':blob-party:': { file: 'blob-party-gif.gif', label: 'party' },
  ':blob-sad:': { file: 'blob-sad.png', label: 'sad' },
  ':blob-nod:': { file: 'blob-nod-gif.gif', label: 'nod' },
  ':blob-eyes:': { file: 'blob-eyes-gif.gif', label: 'eyes' },
  ':blob-clap:': { file: 'blob-clap-gif.gif', label: 'clap' },
  ':blob-bongo:': { file: 'blob-bongo-gif.gif', label: 'bongo' },
  ':blob-bounce:': { file: 'blob-bounce-gif.gif', label: 'bounce' },
  ':blob-pats:': { file: 'blob-pats-gif.gif', label: 'pats' },
  ':blob-peek:': { file: 'blob-peek-gif.gif', label: 'peek' },
  ':blob-sleep:': { file: 'blob-sleep-gif.gif', label: 'sleep' },
  ':blob-wink:': { file: 'blob-wink-gif.gif', label: 'wink' },
  ':blob-panic:': { file: 'blob-panic-gif.gif', label: 'panic' },
  ':blob-cheer:': { file: 'blob-cheer-gif.gif', label: 'cheer' },
  ':blob-beers:': { file: 'blob-beers-gif.gif', label: 'cheers' },
  ':blob-caramell-dance:': { file: 'blob-caramell-dance-gif.gif', label: 'dance' },
  ':blob-conga:': { file: 'blob-conga-gif.gif', label: 'conga' },
  ':blob-rofl:': { file: 'blob-rofl.png', label: 'rofl' },
  ':blob-angry:': { file: 'blob-angry.png', label: 'angry' },
  ':blob-shrug:': { file: 'blob-shrug.png', label: 'shrug' },
  ':blob-pray:': { file: 'blob-pray.png', label: 'pray' },
  ':blob-sob:': { file: 'blob-sob.png', label: 'sob' },
  ':blob-ok:': { file: 'blob-ok.png', label: 'ok' },
  ':blob-no:': { file: 'blob-no.png', label: 'no' },
  ':blob-facepalm:': { file: 'blob-facepalm.png', label: 'facepalm' },
}

export const MEOW_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  ':meow-party:': { file: 'meow-party.gif', label: 'party' },
  ':meow-dancing:': { file: 'meow-dancing-gif.gif', label: 'dancing' },
  ':meow-bounce:': { file: 'meow-bounce-gif.gif', label: 'bounce' },
  ':meow-bop:': { file: 'meow-bop-gif.gif', label: 'bop' },
  ':meow-trampoline:': { file: 'meow-trampoline-gif.gif', label: 'jump' },
  ':meow-comfy-wave:': { file: 'meow-comfy-wave-gif.gif', label: 'wave' },
  ':meow-peek:': { file: 'meow-peek-gif.gif', label: 'peek' },
  ':meow-coffee:': { file: 'meow-coffee-gif.gif', label: 'coffee' },
  ':meow-coffee-spitting:': { file: 'meow-coffee-spitting-gif.gif', label: 'spit' },
  ':meow-me-want:': { file: 'meow-me-want-gif.gif', label: 'want' },
  ':meow-popcorn:': { file: 'meow-popcorn.gif', label: 'popcorn' },
  ':meow-rainbow:': { file: 'meow-rainbow-gif.gif', label: 'rainbow' },
  ':meow-sip:': { file: 'meow-sip-fast.gif', label: 'sip' },
  ':meow-sip-intensifies:': { file: 'meow-sip-intensifies.gif', label: 'sip+' },
  ':meow-tired:': { file: 'meow-tired-gif.gif', label: 'tired' },
  ':meow-angry-intensifies:': { file: 'meow-angry-intensifies-gif.gif', label: 'angry!' },
  ':meow-photo:': { file: 'meow-photo-gif.gif', label: 'photo' },
  ':meow-love:': { file: 'meow-love.png', label: 'love' },
  ':meow-in-love:': { file: 'meow-in-love.png', label: 'in love' },
  ':meow-hug:': { file: 'meow-hug.png', label: 'hug' },
  ':meow-blush:': { file: 'meow-blush.png', label: 'blush' },
  ':meow-happy-cry:': { file: 'meow-happy-cry.png', label: 'happy cry' },
  ':meow-cry:': { file: 'meow-cry.png', label: 'cry' },
  ':meow-big-sob:': { file: 'meow-big-sob.png', label: 'sob' },
  ':meow-pensive:': { file: 'meow-pensive.png', label: 'pensive' },
  ':meow-smile:': { file: 'meow-smile.png', label: 'smile' },
  ':meow-giggle:': { file: 'meow-giggle.png', label: 'giggle' },
  ':meow-wow:': { file: 'meow-wow.png', label: 'wow' },
  ':meow-shocked:': { file: 'meow-shocked.png', label: 'shocked' },
  ':meow-think-smart:': { file: 'meow-think-smart.png', label: 'think' },
  ':meow-thonkang:': { file: 'meow-thonkang.png', label: 'thonk' },
  ':meow-prayge:': { file: 'meow-prayge.png', label: 'prayge' },
  ':meow-ok:': { file: 'meow-ok.png', label: 'ok' },
  ':meow-shrug:': { file: 'meow-shrug.png', label: 'shrug' },
  ':meow-not-like-this:': { file: 'meow-not-like-this.png', label: 'no...' },
  ':meow-sad-life:': { file: 'meow-sad-life.png', label: 'sad' },
  ':meow-im-fine:': { file: 'meow-im-fine.png', label: 'fine' },
  ':meow-nom-strawberry:': { file: 'meow-nom-strawberry.png', label: 'nom' },
  ':meow-cookie:': { file: 'meow-cookie.png', label: 'cookie' },
  ':meow-starstruck:': { file: 'meow-starstruck.png', label: 'star' },
  ':meow-yikes:': { file: 'meow-yikes.png', label: 'yikes' },
  ':meow-nerd:': { file: 'meow-nerd.png', label: 'nerd' },
  ':meow-salute:': { file: 'meow-salute.png', label: 'salute' },
  ':meow-0w0:': { file: 'meow-0w0.png', label: '0w0' },
}

export const FROGE_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  // Animated GIFs
  ':froge-happy:': { file: 'froge-happy2.gif', label: 'happy' },
  ':froge-nod:': { file: 'froge-nod.gif', label: 'nod' },
  ':froge-wave:': { file: 'froge-wave.gif', label: 'wave' },
  ':froge-pet:': { file: 'froge-pet.gif', label: 'pet' },
  ':froge-boi:': { file: 'froge-boi.gif', label: 'boi' },
  ':froge-boost:': { file: 'froge-boost.gif', label: 'boost' },

  ':froge-alarm:': { file: 'froge-alarm.gif', label: 'alarm' },
  ':froge-angry:': { file: 'froge-angry.gif', label: 'angry' },
  ':froge-anime:': { file: 'froge-anime.gif', label: 'anime' },
  ':froge-chair:': { file: 'froge-chair.gif', label: 'chair' },
  ':froge-explosion:': { file: 'froge-explosion.gif', label: 'boom' },
  ':froge-guitar:': { file: 'froge-guitar.gif', label: 'guitar' },
  ':froge-gun:': { file: 'froge-gun.gif', label: 'gun' },
  ':froge-help:': { file: 'froge-help.gif', label: 'help' },
  ':froge-lick:': { file: 'froge-lick.gif', label: 'lick' },
  ':froge-ping:': { file: 'froge-ping.gif', label: 'ping' },
  ':froge-poof:': { file: 'froge-poof.gif', label: 'poof' },
  ':froge-popcorn:': { file: 'froge-popcorn.gif', label: 'popcorn' },
  ':froge-rainbow:': { file: 'froge-rainbow.gif', label: 'rainbow' },
  ':froge-ramen:': { file: 'froge-ramen.gif', label: 'ramen' },
  ':froge-run:': { file: 'froge-run.gif', label: 'run' },
  ':froge-sleep:': { file: 'froge-sleep.gif', label: 'sleep' },
  ':froge-sombrero:': { file: 'froge-sombrero.gif', label: 'sombrero' },
  ':froge-stab:': { file: 'froge-stab.gif', label: 'stab' },
  ':froge-stick:': { file: 'froge-stick.gif', label: 'stick' },
  ':froge-sweat:': { file: 'froge-sweat.gif', label: 'sweat' },
  ':froge-sword:': { file: 'froge-sword.gif', label: 'sword' },
  ':froge-thanos:': { file: 'froge-thanos.gif', label: 'thanos' },
  ':froge-type:': { file: 'froge-type.gif', label: 'typing' },
  ':froge-wink:': { file: 'froge-wink.gif', label: 'wink' },
  ':froge-wizard:': { file: 'froge-wizard.gif', label: 'wizard' },
  // Static PNGs
  ':froge:': { file: 'froge.png', label: 'froge' },
  ':froge-love:': { file: 'froge-love.png', label: 'love' },
  ':froge-hug:': { file: 'froge-hug.png', label: 'hug' },
  ':froge-hugging:': { file: 'froge-hugging.png', label: 'hugging' },
  ':froge-sad:': { file: 'froge-sad.png', label: 'sad' },
  ':froge-ok:': { file: 'froge-ok.png', label: 'ok' },
  ':froge-pray:': { file: 'froge-pray.png', label: 'pray' },
  ':froge-thonk:': { file: 'froge-thonk.png', label: 'thonk' },
  ':froge-shrug:': { file: 'froge-shrug.png', label: 'shrug' },
  ':froge-peek:': { file: 'froge-peek.png', label: 'peek' },
  ':froge-pog:': { file: 'froge-pog.png', label: 'pog' },
  ':froge-ez:': { file: 'froge-ez.png', label: 'ez' },
  ':froge-king:': { file: 'froge-king.png', label: 'king' },
  ':froge-gold:': { file: 'froge-gold.png', label: 'gold' },
  ':froge-detective:': { file: 'froge-detective.png', label: 'detective' },
  ':froge-dab:': { file: 'froge-dab.png', label: 'dab' },
  ':froge-dank:': { file: 'froge-dank.png', label: 'dank' },
  ':froge-verify:': { file: 'froge-verify.png', label: 'verify' },
  ':froge-blushsleep:': { file: 'froge-blushsleep.png', label: 'blush' },
  ':froge-suspicious:': { file: 'froge-suspicious.png', label: 'sus' },
}

export const PARROT_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  // Classic parrots
  ':parrot:': { file: 'parrot.gif', label: 'parrot' },
  ':parrot-original:': { file: 'parrot-original.gif', label: 'original' },
  ':parrot-fast:': { file: 'parrot-fast.gif', label: 'fast' },
  ':parrot-ultra-fast:': { file: 'parrot-ultra-fast.gif', label: 'ultra fast' },
  ':parrot-slow:': { file: 'parrot-slow.gif', label: 'slow' },
  ':parrot-slomo:': { file: 'parrot-slomo.gif', label: 'slomo' },
  ':parrot-reverse:': { file: 'parrot-reverse.gif', label: 'reverse' },
  ':parrot-bouncing:': { file: 'parrot-bouncing.gif', label: 'bounce' },
  ':parrot-spinning:': { file: 'parrot-spinning.gif', label: 'spin' },
  ':parrot-rotating:': { file: 'parrot-rotating.gif', label: 'rotate' },
  ':parrot-horizontal:': { file: 'parrot-horizontal.gif', label: 'horizontal' },
  ':parrot-vertical:': { file: 'parrot-vertical.gif', label: 'vertical' },
  ':parrot-fading:': { file: 'parrot-fading.gif', label: 'fading' },
  ':parrot-invisible:': { file: 'parrot-invisible.gif', label: 'invisible' },
  // Emotions
  ':parrot-angry:': { file: 'parrot-angry.gif', label: 'angry' },
  ':parrot-sad:': { file: 'parrot-sad.gif', label: 'sad' },
  ':parrot-confused:': { file: 'parrot-confused.gif', label: 'confused' },
  ':parrot-bored:': { file: 'parrot-bored.gif', label: 'bored' },
  ':parrot-cool:': { file: 'parrot-cool.gif', label: 'cool' },
  ':parrot-evil:': { file: 'parrot-evil.gif', label: 'evil' },
  ':parrot-love:': { file: 'parrot-love.gif', label: 'love' },
  ':parrot-sleeping:': { file: 'parrot-sleeping.gif', label: 'sleeping' },
  ':parrot-deal-with-it:': { file: 'parrot-deal-with-it.gif', label: 'deal w/ it' },
  ':parrot-thumbs-up:': { file: 'parrot-thumbs-up.gif', label: 'thumbs up' },
  ':parrot-upvote:': { file: 'parrot-upvote.gif', label: 'upvote' },
  ':parrot-middle:': { file: 'parrot-middle.gif', label: 'middle' },
  // Party / dancing
  ':parrot-conga:': { file: 'parrot-conga.gif', label: 'conga' },
  ':parrot-conga-party:': { file: 'parrot-conga-party.gif', label: 'conga party' },
  ':parrot-shuffle-party:': { file: 'parrot-shuffle-party.gif', label: 'shuffle' },
  ':parrot-shuffle:': { file: 'parrot-shuffle.gif', label: 'shuffle' },
  ':parrot-disco:': { file: 'parrot-disco.gif', label: 'disco' },
  ':parrot-fiesta:': { file: 'parrot-fiesta.gif', label: 'fiesta' },
  ':parrot-birthday-party:': { file: 'parrot-birthday-party.gif', label: 'birthday' },
  ':parrot-maracas:': { file: 'parrot-maracas.gif', label: 'maracas' },
  ':parrot-explody:': { file: 'parrot-explody.gif', label: 'explody' },
  // Food & drinks
  ':parrot-coffee:': { file: 'parrot-coffee.gif', label: 'coffee' },
  ':parrot-beer:': { file: 'parrot-beer.gif', label: 'beer' },
  ':parrot-dark-beer:': { file: 'parrot-dark-beer.gif', label: 'dark beer' },
  ':parrot-boba:': { file: 'parrot-boba.gif', label: 'boba' },
  ':parrot-popcorn:': { file: 'parrot-popcorn.gif', label: 'popcorn' },
  ':parrot-pizza:': { file: 'parrot-pizza.gif', label: 'pizza' },
  ':parrot-sushi:': { file: 'parrot-sushi.gif', label: 'sushi' },
  ':parrot-taco:': { file: 'parrot-taco.gif', label: 'taco' },
  ':parrot-donut:': { file: 'parrot-donut.gif', label: 'donut' },
  ':parrot-banana:': { file: 'parrot-banana.gif', label: 'banana' },
  ':parrot-ice-cream:': { file: 'parrot-ice-cream.gif', label: 'ice cream' },
  ':parrot-margarita:': { file: 'parrot-margarita.gif', label: 'margarita' },
  // Costumes / characters
  ':parrot-cop:': { file: 'parrot-cop.gif', label: 'cop' },
  ':parrot-pirate:': { file: 'parrot-pirate.gif', label: 'pirate' },
  ':parrot-viking:': { file: 'parrot-viking.gif', label: 'viking' },
  ':parrot-jedi:': { file: 'parrot-jedi.gif', label: 'jedi' },
  ':parrot-sith:': { file: 'parrot-sith.gif', label: 'sith' },
  ':parrot-harry-potter:': { file: 'parrot-harry-potter.gif', label: 'potter' },
  ':parrot-gentleman:': { file: 'parrot-gentleman.gif', label: 'gentleman' },
  ':parrot-goth:': { file: 'parrot-goth.gif', label: 'goth' },
  ':parrot-ski:': { file: 'parrot-ski.gif', label: 'ski' },
  ':parrot-biker:': { file: 'parrot-biker.gif', label: 'biker' },
  // Tech
  ':parrot-laptop:': { file: 'parrot-laptop.gif', label: 'laptop' },
  ':parrot-database:': { file: 'parrot-database.gif', label: 'database' },
  ':parrot-github:': { file: 'parrot-github.gif', label: 'github' },
  ':parrot-shipit:': { file: 'parrot-shipit.gif', label: 'ship it' },
  ':parrot-crypto:': { file: 'parrot-crypto.gif', label: 'crypto' },
  ':parrot-science:': { file: 'parrot-science.gif', label: 'science' },
  ':parrot-fix:': { file: 'parrot-fix.gif', label: 'fix' },
  // Party friends
  ':party-cat:': { file: 'party-cat.gif', label: 'party cat' },
  ':party-doge:': { file: 'party-doge.gif', label: 'doge' },
  ':party-nyan:': { file: 'party-nyan.gif', label: 'nyan' },
  ':party-gopher:': { file: 'party-gopher.gif', label: 'gopher' },
  ':party-owl:': { file: 'party-owl.gif', label: 'owl' },
  ':party-sloth:': { file: 'party-sloth.gif', label: 'sloth' },
  ':party-wizard:': { file: 'party-wizard.gif', label: 'wizard' },
  ':party-poop:': { file: 'party-poop.gif', label: 'poop' },
  ':party-troll:': { file: 'party-troll.gif', label: 'troll' },
}

export const SHIBLOB_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  ':shiblob-happy:': { file: 'shiblob-happy.png', label: 'happy' },
  ':shiblob-smile:': { file: 'shiblob-smile.png', label: 'smile' },
  ':shiblob-cool:': { file: 'shiblob-cool.png', label: 'cool' },
  ':shiblob-wink:': { file: 'shiblob-wink.png', label: 'wink' },
  ':shiblob-ok:': { file: 'shiblob-ok.png', label: 'ok' },
  ':shiblob-ok-wink:': { file: 'shiblob-ok-wink.png', label: 'ok wink' },
  ':shiblob-thumbs-up:': { file: 'shiblob-thumbs-up.png', label: 'thumbs up' },
  ':shiblob-heart-1:': { file: 'shiblob-heart-1.png', label: 'heart' },
  ':shiblob-heart-2:': { file: 'shiblob-heart-2.png', label: 'heart 2' },
  ':shiblob-heart-3:': { file: 'shiblob-heart-3.png', label: 'heart 3' },
  ':shiblob-melt:': { file: 'shiblob-melt.png', label: 'melt' },
  ':shiblob-reach:': { file: 'shiblob-reach.png', label: 'reach' },
  ':shiblob-peek:': { file: 'shiblob-peek.png', label: 'peek' },
  ':shiblob-photo:': { file: 'shiblob-photo.png', label: 'photo' },
  ':shiblob-lurk:': { file: 'shiblob-lurk.png', label: 'lurk' },
  ':shiblob-nerd:': { file: 'shiblob-nerd.png', label: 'nerd' },
  ':shiblob-evil:': { file: 'shiblob-evil.png', label: 'evil' },
  ':shiblob-robber:': { file: 'shiblob-robber.png', label: 'robber' },
  ':shiblob-police-ban:': { file: 'shiblob-police-ban.png', label: 'police' },
  ':shiblob-ban:': { file: 'shiblob-ban.png', label: 'ban' },
}

export const YOYO_EMOJI_MAP: Record<string, { file: string; label: string }> = {
  ':yoyo-angry:': { file: 'angry.gif', label: 'angry' },
  ':yoyo-attitude:': { file: 'attitude.gif', label: 'attitude' },
  ':yoyo-blow-up:': { file: 'blow_up.gif', label: 'blow up' },
  ':yoyo-bullhorn:': { file: 'bullhorn.gif', label: 'bullhorn' },
  ':yoyo-chest-thump:': { file: 'chest_thump.gif', label: 'chest thump' },
  ':yoyo-cough:': { file: 'cough.gif', label: 'cough' },
  ':yoyo-entranced:': { file: 'entranced.gif', label: 'entranced' },
  ':yoyo-excited:': { file: 'excited.gif', label: 'excited' },
  ':yoyo-eyebrows:': { file: 'eyebrows.gif', label: 'eyebrows' },
  ':yoyo-good-job:': { file: 'good_job.gif', label: 'good job' },
  ':yoyo-haha:': { file: 'haha.gif', label: 'haha' },
  ':yoyo-headbutt:': { file: 'headbutt.gif', label: 'headbutt' },
  ':yoyo-hiding:': { file: 'hiding.gif', label: 'hiding' },
  ':yoyo-holding-bomb:': { file: 'holding_bomb.gif', label: 'bomb' },
  ':yoyo-in-love:': { file: 'in_love.gif', label: 'in love' },
  ':yoyo-injured:': { file: 'injured.gif', label: 'injured' },
  ':yoyo-looking:': { file: 'looking.gif', label: 'looking' },
  ':yoyo-lookout:': { file: 'lookout.gif', label: 'lookout' },
  ':yoyo-love:': { file: 'love.gif', label: 'love' },
  ':yoyo-money-bath:': { file: 'money_bath.gif', label: 'money bath' },
  ':yoyo-nudge:': { file: 'nudge.gif', label: 'nudge' },
  ':yoyo-pointing:': { file: 'pointing.gif', label: 'pointing' },
  ':yoyo-puking:': { file: 'puking.gif', label: 'puking' },
  ':yoyo-quivering:': { file: 'quivering.gif', label: 'quivering' },
  ':yoyo-reading:': { file: 'reading.gif', label: 'reading' },
  ':yoyo-say-nothing:': { file: 'say_nothing.gif', label: 'say nothing' },
  ':yoyo-scared:': { file: 'scared.gif', label: 'scared' },
  ':yoyo-scheming:': { file: 'scheming.gif', label: 'scheming' },
  ':yoyo-see-money:': { file: 'see_money.gif', label: 'see money' },
  ':yoyo-sick:': { file: 'sick.gif', label: 'sick' },
  ':yoyo-surrender:': { file: 'surrender.gif', label: 'surrender' },
  ':yoyo-sweaty:': { file: 'sweaty.gif', label: 'sweaty' },
  ':yoyo-whining:': { file: 'whining.gif', label: 'whining' },
  ':yoyo-whisper:': { file: 'whisper.gif', label: 'whisper' },
  ':yoyo-yelling:': { file: 'yelling.gif', label: 'yelling' },
  ':yoyo-zombie:': { file: 'zombie.gif', label: 'zombie' },
}

/** Combined lookup used by getCustomEmojiUrl / getCustomEmojiLabel. */
const PACK_MAP: Array<{
  map: Record<string, { file: string; label: string }>
  base: string
}> = [
  { map: BLOB_EMOJI_MAP, base: BLOB_BASE_URL },
  { map: MEOW_EMOJI_MAP, base: MEOW_BASE_URL },
  { map: FROGE_EMOJI_MAP, base: FROGE_BASE_URL },
  { map: PARROT_EMOJI_MAP, base: PARROT_BASE_URL },
  { map: SHIBLOB_EMOJI_MAP, base: SHIBLOB_BASE_URL },
  { map: YOYO_EMOJI_MAP, base: YOYO_BASE_URL },
]

/**
 * Returns true when the emoji string is a custom emoji (wrapped in colons).
 */
export function isCustomEmoji(emoji: string): boolean {
  return emoji.startsWith(':') && emoji.endsWith(':')
}

/**
 * Returns the image URL for a custom emoji key.
 * Returns null when the key is not found in any pack.
 */
export function getCustomEmojiUrl(emoji: string): string | null {
  for (const { map, base } of PACK_MAP) {
    const entry = map[emoji]
    if (entry) return `${base}/${entry.file}`
  }

  return null
}

/**
 * Returns the display label for a custom emoji key.
 */
export function getCustomEmojiLabel(emoji: string): string {
  for (const { map } of PACK_MAP) {
    if (map[emoji]) return map[emoji].label
  }

  return emoji
}

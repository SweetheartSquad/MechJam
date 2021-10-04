// format:
// ['player line', 'enemy line', 'player line', ...]
// ['', 'enemy starts', '', 'enemy continues', 'player line', ...]
export const dialogue = {
	start: [
		['You again?!', "You'll never defeat me!"],
		["You won't get away this time!", "I'd like to see you try to stop me!"],
		['', 'Kehehe...', '', "I'll destroy you!", 'Not if I destroy you first!'],
	],
	lose: [
		['', 'I hope you learned your lesson...'],
		['NOOooo...', 'Take that, fool!'],
	],
	win: [
		['', 'GYAARGH!!!', 'Serves you right!'],
		['Ha!', '', 'Get on my level!', '..insolent.. fool...'],
	],
	// player hit
	hurt: [
		["Careful, that one could've killed me!", "That's the idea!!"],
		['Ouch!'],
	],
	// enemy hit
	hit: [
		['', 'Krhh!!', '', "Don't think that hit matters!"],
		['', 'Argh!'],
		['Take that!', 'Grrr...'],
	],
	overheat: [
		["Gettin' hot in here..."],
		['Ah! Gotta watch the heat...'],
		['', "What's the matter, can't take the heat!?"],
	],
	// nothing interesting happened for awhile
	delay: [["So.. what's up?", 'Nothing much, die!!']],
};

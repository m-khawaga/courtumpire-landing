// Original practice activities. Shared publishing defaults are applied in catalogue.mjs.
// Court coordinates: far baseline 32, net 200, near baseline 368;
// service lines 114/286, singles sidelines 80/280, centre service line 180.
const P = (label, x, y) => [label, x, y];
const D = (description, players, balls = [], targets = [], moves = [], wall = false) => ({ description, players, balls, targets, moves, wall });
export const additionalActivities = [
  {
    id:'racket-bounce-control', title:'Racket-face bounce control', players:[1], intro:true, suggested:8, minimum:4,
    focus:['Consistency'], description:'Learn to cushion the ball and control the racket face without hitting across court.',
    setup:'A stands in the near service box with a racket and one ball. Leave at least two racket lengths of clear space on every side. No net crossing is needed.',
    instructions:['Bounce the ball upwards on the strings to about waist height, letting it touch the court between racket contacts.', 'After five controlled contacts, catch the ball and repeat with the other racket face.', 'If the ball escapes your space, stop the sequence and walk to retrieve it. Restart from zero.', 'Complete three sequences on each face, rest for 20 seconds and repeat until the block ends.'],
    scoring:'Count consecutive controlled contacts. A sequence is complete at five; record how many complete sequences you make rather than chasing a loose ball.',
    rotation:'Solo: alternate racket faces after every sequence, including an unsuccessful sequence. Rest after six sequences.',
    easier:'Use a hand catch after each single racket bounce, or allow two court bounces.', harder:'Remove the court bounce and keep five gentle taps on the strings before catching.', mixed:'Not applicable: solo activity.',
    safety:'Keep taps low and stay in the clear service box. Stop before retrieving a ball near another court; do not run backwards after it.',
    diagram:D('A stays inside the near service box. T marks a small personal control area. The short arrow represents local racket-to-ball control, not a shot over the net; the actual taps travel upwards.',[P('A',230,250)],[[240,263,250,237]],[[205,225,50,50,'T']])
  },
  {
    id:'serve-toss-and-catch', title:'Serve toss and catch', players:[1], focus:['Serve and return'], suggested:8, minimum:4,
    description:'Rehearse a repeatable service toss without a full serve or a hurried swing.',
    setup:'A stands behind the near baseline in a comfortable serving stance with one ball. Keep the racket in the other hand or place it safely outside the run-off area.',
    instructions:['Release the ball upwards with the tossing hand from your normal starting position. Do not hit it.', 'Let an uncomfortable toss fall without chasing it. For a comfortable toss, catch it with the same hand or let it bounce safely in front.', 'Make five relaxed attempts on the deuce side, then move behind the ad side for five more.', 'Rest for 20 seconds after ten attempts. Repeat, finishing the current attempt when time ends.'],
    scoring:'Count tosses that can be caught without stepping or stretching. Compare your two five-attempt totals; height and contact location are personal practice choices.',
    rotation:'Solo: change side every five attempts and pause after ten. No ball is served into an occupied court.',
    easier:'Toss lower and concentrate on a smooth release.', harder:'Add a slow service preparation while still catching instead of swinging.', mixed:'Not applicable: solo activity.',
    safety:'Leave the back and sides clear, avoid forced shoulder positions and stop if the movement hurts. Do not attempt a swing while catching.',
    diagram:D('A practises a vertical toss behind the near deuce baseline, then moves to the ad side. The short ball arrow beside A represents the toss rising locally, not forward court travel; no ball crosses the net.',[P('A',225,383)],[[245,388,245,372]],[],[[225,383,135,383]])
  },
  {
    id:'self-feed-drive-recovery', title:'Self-feed drive and recovery', players:[1], focus:['Consistency','Movement'], suggested:10, minimum:5,
    description:'Link a balanced groundstroke with a deliberate return to a useful starting position.',
    setup:'A starts just behind the near baseline with one ball. T is the middle third of the far backcourt, between the service line and baseline. The opposite court must be empty.',
    instructions:['Take two easy steps towards the deuce corner, drop the ball ahead, let it bounce once and drive it towards T.', 'After the shot, recover to the centre mark before walking around the net to retrieve the ball.', 'Repeat towards the ad corner with the appropriate groundstroke. Alternate corners for six attempts.', 'Rest briefly after six attempts and continue. Do not hit another ball until the court is clear.'],
    scoring:'One point for landing in T and one for a balanced recovery to the centre before retrieval. Count out of twelve per six-shot round.',
    rotation:'Solo: alternate corners every attempt. Retrieval is a walking rest between shots, not a race.',
    easier:'Start nearer the service line and use the whole far singles backcourt.', harder:'Use a smaller deep target while retaining a controlled finish.', mixed:'Not applicable: solo activity.',
    safety:'Use one ball, check the opposite court and leave clear walking routes around the net. Never swing while another person retrieves.',
    diagram:D('A moves from the near centre to the deuce side, self-feeds a groundstroke to deep central T and returns to centre. Mirror the next attempt.',[P('A',180,383)],[[235,345,180,85]],[[145,40,70,65,'T']],[[180,383,235,383],[235,383,180,383]])
  },
  {
    id:'approach-split-step-rehearsal', title:'Approach and split-step rehearsal', players:[1], equipment:['rackets'], focus:['Movement','Volleys'], intro:true, suggested:8, minimum:4,
    description:'Connect forward recovery, a balanced split step and a controlled volley shadow.',
    setup:'A starts behind the near baseline with a racket. No ball is used. The centre service line is the forward reference and the service line is the stopping area.',
    instructions:['Walk forward along the centre of the court, making a slow approach-shot shadow before reaching the service line.', 'Stop in balance near the service line with a small split step; do not jump towards the net.', 'Make one forehand-volley shadow, walk back facing your route and repeat with a backhand-volley shadow.', 'Complete four approaches, rest for 20 seconds and repeat until time ends.'],
    scoring:'Count a complete sequence only when the approach, balanced stop and volley shadow are controlled. Aim for four smooth sequences per round.',
    rotation:'Solo: alternate forehand and backhand shadows; use the walking return and scheduled rest to recover.',
    easier:'Walk without a racket and use a shorter approach.', harder:'Use an easy jog while maintaining a balanced stop and safe walking return.', mixed:'Not applicable: solo activity.',
    safety:'Use forward walking for the return route rather than running backwards. Keep well away from the net and loose balls.',
    diagram:D('A moves forward from behind the near baseline to the service line, stops in balance and shadows a volley. Dashed arrows show the forward and walking return routes; no ball is used.',[P('A',180,383)],[],[],[[170,383,170,288],[195,288,195,383]])
  },
  {
    id:'wall-soft-volley-control', title:'Wall soft-volley control', players:[1], facilities:['court','wall'], sources:['home'], level:'Intermediate', focus:['Volleys'], suggested:10, minimum:5,
    description:'Control short, gentle volleys against a permitted practice wall.',
    setup:'A faces a permitted practice wall in a clear area, about three metres away or farther if needed. T is a broad area above its net-height line. The diagram wall replaces the tennis net.',
    instructions:['Gently feed one ball against T, then volley the rebound before it bounces.', 'Keep the swing short and the next contact within easy reach. Do not try to save a low or wide rebound.', 'A bounce, miss or ball outside comfortable reach ends the sequence. Stop and retrieve before restarting.', 'After five sequences, rest for 30 seconds. Repeat and finish the current sequence at time.'],
    scoring:'Count controlled volleys after the feed. Aim for three, then five; count only comfortable contacts above the wall line.',
    rotation:'Solo: pause after five sequences and switch the starting volley face for the next group.',
    easier:'Let the rebound bounce once and finish with a catch after each return.', harder:'Alternate forehand and backhand volleys while keeping the same safe pace.', mixed:'Not applicable: solo activity.',
    safety:'Use only a wall approved for tennis, check side clearance and keep the rebound gentle. Stop rather than crowding the wall.',
    diagram:D('A makes gentle no-bounce exchanges with T on the practice wall. The two arrows represent the outgoing ball and rebound, not two balls.',[P('A',180,250)],[[170,235,140,93],[145,93,195,235]],[[110,65,140,35,'T']],[],true)
  },
  {
    id:'self-feed-high-clearance-lob', title:'Self-feed high-clearance lob', players:[1], focus:['Consistency'], suggested:10, minimum:5,
    description:'Practise a controlled high trajectory that lands well inside the far baseline.',
    setup:'A starts near the near service line with one ball. T is the central far backcourt, safely short of the baseline. The entire opposite court and overhead space must be clear.',
    instructions:['Drop the ball ahead, allow one bounce and send a gentle high groundstroke over the net towards T.', 'Watch its first bounce, then wait for it to stop before walking to retrieve it.', 'Alternate forehand and backhand attempts for six shots, adjusting height rather than hitting harder.', 'Pause after six attempts and repeat. Finish the current shot when the block ends.'],
    scoring:'One point for clearing the net comfortably and landing in T. Keep hits out of six; a ball over the fence is not a success.',
    rotation:'Solo: alternate shot sides every attempt. Walk to retrieve between attempts.',
    easier:'Use the whole far singles backcourt as target and start nearer the net.', harder:'Begin behind the near baseline while retaining a generous margin inside the far baseline.', mixed:'Not applicable: solo activity.',
    safety:'Check for roofs, lights, adjacent players and wind before lobbing. Use gentle height and stop if the ball risks entering another court.',
    diagram:D('A self-feeds a high groundstroke from the near service line to deep central T. The arrow shows direction only; lob height is explained in the instructions.',[P('A',180,300)],[[180,282,180,75]],[[120,45,120,60,'T']])
  },
  {
    id:'mini-court-depth-ladder', title:'Mini-court depth ladder', players:[2], focus:['Consistency','Movement'], intro:true, suggested:10, minimum:5,
    description:'Earn the right to move back by keeping the same relaxed rally rhythm.',
    setup:'A and B face one another near opposite service lines. Begin inside the central service-box area using one ball. Singles boundaries apply.',
    instructions:['A drop-feeds and both play after one bounce, keeping the ball comfortable for the partner.', 'After six consecutive returns, stop the ball and both move one normal step towards the baseline.', 'Start a new rally from that distance. A miss or second bounce ends the sequence but does not force a move forward.', 'After three failed attempts at a distance, move one step closer. Alternate feeder every rally and finish the current rally at time.'],
    scoring:'Record the farthest shared starting distance from which you complete six returns. This is cooperative progression, not official scoring.',
    rotation:'Both move together only while the ball is dead. Alternate the feeder every rally; pause after six rallies.',
    easier:'Require four returns before moving back.', harder:'Require ten returns and aim behind the partner’s service line once both reach the baseline.', mixed:'Use an unequal starting distance if that gives both players a comfortable rally.',
    safety:'Check behind before taking each step and stop the ball before changing distance. Keep spare balls outside the run-off area.',
    diagram:D('A and B begin at opposite service lines and rally centrally. Dashed arrows show each moving back towards their own baseline after a successful six-return rally.',[P('A',180,290),P('B',180,110)],[[170,275,170,125],[195,125,195,275]],[],[[180,300,180,335],[180,100,180,65]])
  },
  {
    id:'forehand-backhand-eight', title:'Straight-and-diagonal figure eight', players:[2], level:'Intermediate', focus:['Crosscourt','Down the line','Movement'], suggested:12, minimum:6,
    description:'Coordinate two different directions to rehearse recovery between forehands and backhands.',
    setup:'A and B begin behind opposite singles baselines. A hits every return crosscourt; B hits every return down the line. Use one ball and start at a controlled pace.',
    instructions:['A drop-feeds crosscourt to B. B returns down the line, making A move across the baseline.', 'A returns crosscourt again; B moves across and returns down the line. Repeat the four-corner pattern after one bounce.', 'A miss, second bounce or wrong direction ends the sequence. Reset the ball and recover before restarting.', 'After three sequences exchange direction rules: A goes down the line and B crosscourt. Finish the current sequence at time.'],
    scoring:'Count complete four-return patterns, excluding the feed. Aim for two complete patterns before increasing pace.',
    rotation:'Swap the crosscourt and straight roles every three sequences, regardless of length. Both remain active.',
    easier:'Use shorter distances and broad half-court targets.', harder:'Use deeper targets while keeping the same controlled speed.', mixed:'The stronger player takes the crosscourt role first and supplies comfortable balls; swap only when both agree.',
    safety:'Use controlled depth, keep enough baseline run-off and stop if a player is stretched beyond comfortable reach.',
    diagram:D('A begins near right, B far left. A always hits diagonally and B straight: near right to far left, far left to near left, near left to far right, far right to near right.',[P('A',245,383),P('B',115,17)],[[245,345,115,65],[115,65,115,345],[115,345,245,65],[245,65,245,345]],[],[[245,383,115,383],[115,17,245,17]])
  },
  {
    id:'approach-and-first-volley', title:'Approach and first volley', players:[2], level:'Intermediate', focus:['Volleys','Movement'], suggested:12, minimum:6,
    description:'Follow a short-ball approach with a controlled first volley.',
    setup:'A starts behind the near baseline; B starts at the far baseline with one ball. T is the central far backcourt. B will feed and then supply one comfortable passing ball.',
    instructions:['B gently feeds a short ball that bounces near A’s service line. A moves forward and approaches towards B.', 'A continues forward, makes a balanced split step and B returns a controlled ball within volleying reach.', 'A volleys towards T. End the sequence on that volley’s bounce or any earlier miss; do not play out the point.', 'After five attempts swap feeder and approacher. Finish the current sequence when time ends.'],
    scoring:'The approacher earns one for an in-court approach and one for an in-court first volley. Count out of ten per five-attempt round.',
    rotation:'Swap ends and roles after five attempts, walking around the net while the ball is dead.',
    easier:'B hand-feeds from the service line and catches the approach before feeding a separate volley ball.', harder:'B alternates comfortable forehand and backhand volley feeds without announcing the side.', mixed:'Adjust the feed pace and target size for each approacher, retaining the same five-attempt turns.',
    safety:'B avoids hard passes at the approaching player. A stops well short of the net and retrieves only after the sequence ends.',
    diagram:D('B feeds short to A near the near service line. A approaches towards B, moves forward and receives a comfortable ball for a volley to far central T.',[P('A',180,383),P('B',180,17)],[[170,60,160,300],[160,300,180,65],[190,65,190,250],[190,250,180,80]],[[135,40,90,65,'T']],[[180,383,180,255]])
  },
  {
    id:'defensive-lob-and-recover', title:'Defensive lob and recover', players:[2], level:'Intermediate', focus:['Movement','Consistency'], suggested:12, minimum:6,
    description:'Use a high defensive ball to regain court position under controlled pressure.',
    setup:'A begins behind the near baseline and B at the far service line. B uses a gentle racket feed to a near singles corner. T is the far backcourt; B does not smash the lob.',
    instructions:['B feeds gently to one near corner. A moves to it, lets it bounce once and lobs towards T.', 'A recovers towards the near centre while B allows the lob to bounce. The sequence ends there.', 'B retrieves after the ball stops, then feeds the other corner. Do not hit a second ball during retrieval.', 'After six attempts swap roles. Finish the current attempt when time ends.'],
    scoring:'One point for a lob landing behind the far service line inside singles and one for a balanced recovery. Record out of twelve.',
    rotation:'Alternate fed corners every attempt; swap feeder and defender after six attempts.',
    easier:'Feed closer to the defender’s starting position and use the whole far court.', harder:'Feed a little wider while preserving safe reach and a deep lob target.', mixed:'Use a shorter recovery distance and slower feed for the less mobile player.',
    safety:'B never attempts an overhead in this drill. A should turn and move rather than run backwards; keep adjacent courts and overhead space clear.',
    diagram:D('B feeds gently from the far service line to A’s near right corner. A lobs over B into deep T and recovers towards near centre. Mirror on the next feed.',[P('A',180,383),P('B',180,110)],[[180,125,250,335],[250,335,230,75]],[[90,40,180,65,'T']],[[180,383,250,383],[250,383,180,383]])
  },
  {
    id:'serve-plus-one-decision', title:'Serve plus one decision', players:[2], level:'Intermediate', type:'Competitive game', focus:['Serve and return','Movement'], suggested:12, minimum:6,
    description:'Choose a safe first groundstroke after your serve instead of ending practice at the return.',
    setup:'A serves from behind the near baseline and B receives behind the opposite diagonal baseline. T is the far half-court opposite B’s receiving corner.',
    instructions:['A serves with two attempts into the diagonal service box. A double fault ends the attempt.', 'B returns a legal serve after one bounce into the near singles court. A recovers and plays one further shot towards T.', 'End on the first bounce of A’s third shot or an earlier miss. No winner is needed and no further rally is played.', 'Alternate deuce and ad sides for six attempts, mirroring T. Swap server and receiver after six; finish the current attempt at time.'],
    scoring:'A earns one for a legal serve and one for the third shot landing in T. B counts legal returns separately. This is custom training scoring.',
    rotation:'Six attempts per server, including double faults. B mirrors the receiving position after every attempt.',
    easier:'B returns gently through the middle and A uses the whole far court as target.', harder:'B varies a controlled deep or short return so A must adjust the recovery.', mixed:'Give each server a suitable target size; B supplies a manageable return rather than seeking a winner.',
    safety:'The receiver waits until the server is ready. Keep spare balls away from the server’s feet and retrieve only with a dead ball.',
    diagram:D('A serves from near deuce into the far diagonal service box, B returns to near centre and A plays the next shot into far right T. Mirror for ad serves.',[P('A',225,383),P('B',110,17)],[[225,350,125,160],[110,65,180,320],[180,320,235,80]],[[185,40,90,65,'T']])
  },
  {
    id:'crosscourt-change-line', title:'Crosscourt then change the line', players:[2], level:'Intermediate', type:'Competitive game', focus:['Crosscourt','Down the line'], suggested:12, minimum:6,
    description:'Recognise when to change direction after establishing a diagonal rally.',
    setup:'A and B start behind opposite diagonal singles corners. Agree which player is the direction changer for this round; begin with A.',
    instructions:['A drop-feeds crosscourt. Both complete three cooperative crosscourt returns after the feed.', 'A may change down the line on A’s next comfortable ball; if not comfortable, continue crosscourt until one is.', 'After the down-the-line shot the full singles court is open. Play out the point after one bounce or with volleys.', 'A miss, out ball or second bounce ends the point. After four points give B the change role; mirror the starting diagonal after both rounds.'],
    scoring:'One point for winning the open rally. If a miss ends the cooperative phase, replay without a point. These are custom point-opening rules.',
    rotation:'Change the designated direction changer every four points. Alternate feeder each point and mirror the diagonal after eight points.',
    easier:'Allow the direction change after one crosscourt return and use a gentle pace.', harder:'Require four deep crosscourt returns before the change becomes available.', mixed:'Allow the less experienced changer a larger straight target; keep the opening rally cooperative for both.',
    safety:'Call “open” when changing direction so both know the full court is live. Stop if a stray ball enters either player’s route.',
    diagram:D('A and B first rally on the near-right/far-left diagonal. A then changes to far right T; the full singles point opens after that change.',[P('A',245,383),P('B',115,17)],[[245,345,115,65],[115,65,245,340],[245,340,245,80]],[[185,40,90,65,'T']])
  },
  {
    id:'slice-low-lane', title:'Low slice lane', players:[2], level:'Intermediate', focus:['Down the line','Consistency'], suggested:10, minimum:5,
    description:'Control an underspin groundstroke through a broad straight lane.',
    setup:'A and B stand at opposite service lines on the same half of the singles court. T is the far part of that lane. Start closer only if both can keep comfortable clearance over the net.',
    instructions:['A drop-feeds gently to B. B returns after one bounce using a controlled slice, then A does the same.', 'Keep every return in the agreed half-court lane and give the partner a playable bounce. Do not try to skim the tape.', 'A miss, second bounce or wrong lane ends the sequence. Reset before starting again.', 'Alternate feeder every sequence. After five sequences switch lanes and finish the current sequence when time ends.'],
    scoring:'Count consecutive in-lane slice returns, excluding the feed. Aim for four and then six, valuing control over low height.',
    rotation:'Both switch lanes on dead balls after five sequences; alternate the feeder each time.',
    easier:'Allow a normal groundstroke return between slices or start with one slice followed by a catch.', harder:'Move towards the baselines and keep the broad straight lane.', mixed:'Let the less experienced player use a normal groundstroke while the other practises slice; swap the focus when ready.',
    safety:'Use a comfortable racket path and keep a clear gap between players on each side. Stop for low balls beyond safe reach.',
    diagram:D('A and B exchange one-bounce slice shots down the left singles half, beginning near the service lines. T is the back of the far practice lane; mirror after five sequences.',[P('A',125,300),P('B',125,100)],[[115,280,115,130],[140,130,140,280]],[[80,114,100,55,'T']])
  },
  {
    id:'drop-shot-recover', title:'Short touch and recovery', players:[2], level:'Intermediate', focus:['Movement','Consistency'], suggested:10, minimum:5,
    description:'Move to a short ball and play a controlled touch return before recovering.',
    setup:'A starts behind the near baseline. B stands near the far service line with one ball, ready to feed softly into a near service box. T is the opposite far service box.',
    instructions:['B feeds a gentle short ball into the near deuce service box. A moves forward and lets it bounce once.', 'A sends a soft return into T, stopping in balance before the net. End the sequence on its first bounce or a miss.', 'A walks back to the starting baseline and B retrieves the dead ball. Feed the other side next.', 'After six attempts exchange roles. Finish the current attempt when time ends.'],
    scoring:'One point for reaching the ball in balance and one for a return landing in T. Count out of twelve per six-attempt round.',
    rotation:'Alternate short-ball sides every attempt and switch hitter/feeder every six. The walking reset is part of the rest.',
    easier:'A begins nearer the service line and B feeds less short.', harder:'A begins behind the baseline and aims into a smaller central portion of T.', mixed:'Set a different start distance for each player so nobody has to sprint through the net area.',
    safety:'B gives enough height and time to reach the ball safely. A stops before the net and lets unreachable feeds go.',
    diagram:D('B feeds softly into the near right service box. A moves forward from the baseline and touches the ball into far left service-box T, then walks back after the ball dies.',[P('A',225,383),P('B',180,100)],[[180,125,235,250],[235,250,130,155]],[[90,125,75,55,'T']],[[225,383,235,265]])
  },
  {
    id:'controlled-overhead-feed', title:'Controlled overhead to target', players:[2], level:'Intermediate', focus:['Volleys','Movement'], suggested:10, minimum:5,
    description:'Practise turning and setting up for an overhead without a live chase.',
    setup:'A starts near the near service line and B near the far service line. T is a broad far backcourt target away from B. B feeds a gentle high ball that stays within A’s comfortable range.',
    instructions:['B gently lobs towards A. A turns sideways and moves with small controlled steps rather than backpedalling.', 'A lets the ball bounce once if needed and plays a controlled overhead towards T. Power is not the objective.', 'End on the overhead’s first bounce or a miss. B retrieves only when the ball is dead and A has stopped.', 'After five attempts swap roles. Finish the current attempt when time ends.'],
    scoring:'One point for balanced preparation and one for an overhead landing in T. A safely abandoned feed is simply replayed.',
    rotation:'Swap feeder and overhead hitter after five playable feeds. Pause between attempts to check both players are ready.',
    easier:'Always allow a bounce and feed almost vertically into a comfortable hitting position.', harder:'Take a comfortable feed before the bounce, retaining a controlled target and pace.', mixed:'Adjust lob depth separately for each player and allow a bounce for either at any time.',
    safety:'Do not run backwards or hit towards the feeder. Let a ball that travels behind you bounce and stop; check overhead clearance.',
    diagram:D('B lobs gently from the far service line to A near the near service line. A turns for a controlled overhead towards far right T, away from B. Arrows show direction rather than ball height.',[P('A',140,280),P('B',130,105)],[[130,125,140,300],[140,280,240,75]],[[200,40,75,65,'T']],[[140,280,140,310]])
  },
  {
    id:'service-box-angle-chess', title:'Service-box angle chess', players:[2], type:'Competitive game', focus:['Crosscourt','Consistency'], suggested:10, minimum:5,
    description:'Create angles with placement while keeping the whole point inside the service boxes.',
    setup:'A and B begin outside opposite service lines. Use only the singles-width service-box area on each side of the net. No volleys or overheads are used.',
    instructions:['A drop-feeds into either opposite service box. Both let each ball bounce once before hitting.', 'Aim within the two opposite service boxes, using placement and soft angles rather than pace.', 'A net ball, bounce beyond a service line or singles sideline, volley or second bounce loses the point.', 'Alternate feeder each point. Play six points, pause briefly, then change ends; finish the current point at time.'],
    scoring:'One point per rally. Six-point rounds can finish 3–3; these short-court boundaries are custom practice rules.',
    rotation:'Both play every point, alternate feeds and change ends after six points with the ball dead.',
    easier:'Feed centrally and use a cooperative six-return goal before making it competitive.', harder:'Require the first two returns to alternate left and right service boxes before the point opens.', mixed:'Give the less experienced player both boxes as a target and the stronger player one nominated box.',
    safety:'Keep the pace soft, stop before the net and do not chase a sharp angle onto an adjacent court.',
    diagram:D('A and B play one-bounce points using only the two service boxes on each side. Shaded T areas show the legal landing zones; neither volleys.',[P('A',180,305),P('B',180,95)],[[175,280,115,155],[115,155,245,255]],[[80,114,200,82,'T'],[80,204,200,82,'T']])
  },
  {
    id:'two-returner-serve-lanes', title:'Two-returner serve lanes', players:[3], focus:['Serve and return'], suggested:12, minimum:6,
    description:'Give a server realistic receiving positions while two returners share clear turns.',
    setup:'A serves from behind the near baseline. B receives deuce serves from the far diagonal corner; C receives ad serves from the other far corner. The non-receiver waits behind the baseline outside the active receiver’s swing space.',
    instructions:['A serves from deuce with two attempts. B returns a legal serve towards the near singles backcourt; end on the return’s first bounce or an earlier miss.', 'A moves to ad and C takes the next return. The other receiver watches without entering the point.', 'Complete six attempts, alternating receiving sides even after a double fault.', 'Rotate A → B’s role, B → C’s role, C → server. Finish the current attempt at time.'],
    scoring:'The server counts legal serves out of six. Each receiver counts deep in-court returns out of their three chances; a double fault is a chance with no return point.',
    rotation:'Rotate all three roles every six attempts. Each receiver rests from hitting on alternate attempts; retrieve together only during the dead-ball pause.',
    easier:'The server uses a gentle modified serve from closer to the service line, explicitly as a practice feed.', harder:'Require returns to land in a nominated broad crosscourt backcourt half.', mixed:'Use a wider return target for the less experienced receiver and keep both on the same three-chance schedule.',
    safety:'Receivers keep well apart behind the baseline and do not chase balls into one another’s space. The server waits for the active receiver to be ready.',
    diagram:D('A serves near deuce into the far left service box for B; B returns deep into near T and the attempt ends. On ad serves C receives from the far right corner while B rests.',[P('A',225,383),P('B',110,17),P('C',250,17)],[[225,350,120,155],[110,65,210,325]],[[90,300,180,55,'T']])
  },
  {
    id:'three-player-poach-call', title:'Poach and cover rehearsal', players:[3], level:'Intermediate', focus:['Volleys','Doubles teamwork'], suggested:12, minimum:6,
    description:'Coordinate an interception call with a partner who covers the space left behind.',
    setup:'A starts behind the near baseline, C near the near-left service box net position, and B behind the far baseline. A and C are a pair; B supplies a controlled return. Use one ball.',
    instructions:['A drop-feeds gently towards B. B sends a comfortable return through the near middle, away from C’s body.', 'C calls “mine”, moves across to intercept and volleys into the far right backcourt target T. A moves left to cover the space C leaves.', 'End on the volley’s first bounce or any earlier miss. All three return to their start positions before the next feed.', 'After four attempts rotate A → B, B → C, C → A. Mirror the net player’s starting side after all have held that role; finish the attempt at time.'],
    scoring:'The pair earns one for an early clear call with coordinated cover and one for a volley in T. Count out of eight each round.',
    rotation:'Four attempts per role, then fixed three-way rotation. Nobody feeds during a positional reset.',
    easier:'B underarm-feeds directly from nearer the service line and C makes a short interception step.', harder:'B alternates middle and wide feeds; C calls “stay” on a wide feed and A plays it instead.', mixed:'Reduce the net player’s movement distance and feed pace for each turn as needed.',
    safety:'C moves across only after calling and A stays behind C’s volley path. No hard body returns; stop if both partners pursue the same ball.',
    diagram:D('A feeds B from the near baseline. B returns through the middle; C moves right from near-left net to volley towards far-right T while A covers near left.',[P('A',225,383),P('B',150,17),P('C',115,240)],[[225,345,150,65],[150,65,190,235],[190,235,240,80]],[[200,40,75,65,'T']],[[115,240,190,240],[225,383,115,383]])
  },
  {
    id:'middle-ball-call-volley', title:'Middle-ball call and volley', players:[3], focus:['Doubles teamwork','Volleys'], intro:true, suggested:10, minimum:5,
    description:'Resolve a shared middle ball with a clear call before either partner swings.',
    setup:'B and C stand on opposite halves just inside the near service line. A feeds from the far baseline. Agree that the player nearest the feed’s landing line calls first; the other gives space.',
    instructions:['A sends a gentle feed between B and C, alternating slightly left and right of centre.', 'One partner calls “mine” early and volleys towards the far central backcourt T. The other stays clear and covers their half.', 'End on that volley’s first bounce. If neither calls, or both move into the ball, stop the attempt without a swing.', 'After six feeds rotate A → B, B → C, C → A. Finish the current feed when time ends.'],
    scoring:'One shared point for one clear call followed by one safe in-court volley. A stopped collision-risk attempt earns zero, with no penalty for stopping.',
    rotation:'Six feeds per feeder; both partners stay involved through calling and cover. Rotate only when the ball is dead.',
    easier:'A announces the intended hitter before feeding.', harder:'A varies the feed between the middle and either outer half while keeping gentle pace.', mixed:'Agree a larger responsibility area for the stronger volleyer without removing the other partner’s turns.',
    safety:'A never drives at a player. Both partners stop immediately if responsibility is unclear; do not cross rackets or reach across one another.',
    diagram:D('A feeds towards the near service-line middle between B and C. One calls and volleys into far central T; the partner stays clear. Only one player hits each feed.',[P('A',180,17),P('B',120,260),P('C',240,260)],[[180,65,170,245],[170,245,180,80]],[[125,40,110,65,'T']])
  },
  {
    id:'lob-cover-switch-trio', title:'Lob cover and switch trio', players:[3], level:'Intermediate', focus:['Movement','Doubles teamwork'], suggested:12, minimum:6,
    description:'Practise a partner’s cover call when a lob travels over a net position.',
    setup:'B starts at near-left net, C behind the near-right baseline and A behind the far baseline with one ball. A feeds a gentle lob over B towards the near-left backcourt.',
    instructions:['A lobs over B. B calls “switch”, stops following the ball and moves to the near-right net half.', 'C calls “mine”, turns and moves across to the near-left backcourt, lets the lob bounce and sends a controlled high return to far central T.', 'End on that return’s first bounce or an earlier miss. Reset the staggered starting positions before the next feed.', 'After four feeds rotate A → B, B → C, C → A. Mirror the lob side after a complete three-role cycle; finish the attempt at time.'],
    scoring:'One for a clear switch/ownership call and one for a controlled return landing in T. A safely abandoned unreachable lob is replayed.',
    rotation:'Four feeds per role; B covers the opposite net half while C retrieves. Only the baseline partner hits the lob return.',
    easier:'Use a shorter lob and place C nearer the centre baseline.', harder:'Begin C deeper and keep the return target inside a smaller far central area.', mixed:'Set the lob depth to the receiving player’s mobility and allow an extra bounce as a declared practice adaptation.',
    safety:'B never backpedals under the lob; C turns and moves with a clear route. Stop any ball that requires a blind backward chase or crosses an adjacent court.',
    diagram:D('A lobs over near-left net player B into the near-left backcourt. Near-right baseline player C moves across for the bounce and returns to far central T while B switches to near-right net.',[P('A',180,17),P('B',115,240),P('C',245,383)],[[180,65,110,335],[110,335,180,80]],[[125,40,110,65,'T']],[[115,240,245,240],[245,383,110,383]])
  },
  {
    id:'call-the-direction', title:'Call the direction', players:[3], focus:['Down the line','Crosscourt'], suggested:10, minimum:5,
    description:'Read a simple external cue and choose the correct broad groundstroke target.',
    setup:'A starts behind the near-right baseline and B behind the far baseline with one ball. C stands safely outside the near sideline, observing and calling either “line” or “cross”.',
    instructions:['B gently feeds to A’s near-right groundstroke area. As the ball crosses the net, C calls “line” or “cross”.', 'A plays after one bounce towards the called far backcourt half: right for line, left for cross.', 'End on A’s shot’s first bounce. C confirms the chosen direction; nobody runs after a live ball.', 'After six feeds rotate A → B, B → C, C → A. Mirror A’s corner after a full role cycle; finish the current attempt at time.'],
    scoring:'One point for choosing the called half and one for landing inside that half. Count out of twelve, separating decision from accuracy.',
    rotation:'Six feeds per role. The caller rests physically and supplies the decision cue; everyone takes that role.',
    easier:'C calls before B feeds so A has more preparation time.', harder:'C calls just after the feed bounces, provided A still has comfortable reaction time.', mixed:'Give the less experienced hitter an earlier cue and larger target, retaining the same feed count.',
    safety:'C stays beyond the sideline with enough swing clearance. B keeps feeds comfortable and nobody deliberately wrong-foots a player beyond safe reach.',
    diagram:D('B feeds A at the near-right corner. Off-court caller C chooses line to far-right T1 or cross to far-left T2. Two outgoing arrows show alternatives for one shot, not a required two-ball sequence.',[P('A',245,383),P('B',180,17),P('C',330,290)],[[180,65,245,335],[245,335,235,80],[245,335,120,80]],[[185,40,90,65,'T1'],[85,40,90,65,'T2']])
  },
  {
    id:'short-deep-feeder-triangle', title:'Short-deep feeder triangle', players:[3], level:'Intermediate', focus:['Movement','Consistency'], suggested:12, minimum:6,
    description:'Move forward for a short ball and recover for depth in a controlled three-player pattern.',
    setup:'A starts behind the near baseline, B near the far service line on the left and C behind the far-right baseline. Use one ball. B supplies short balls; C supplies deep balls.',
    instructions:['B feeds softly to the near service-line area. A moves forward, lets it bounce and sends a controlled shot deep to C.', 'C returns a high, gentle ball deep into the near singles court. A turns and recovers in time for one bounce, then sends the next shot gently to B.', 'B volleys or one-bounce feeds short again. Continue only while A can move in balance; a miss or rushed chase ends the sequence.', 'After three sequences rotate A → B, B → C, C → A. Finish the current sequence at time; allow rest between sequences.'],
    scoring:'Count full short–deep cycles completed in control. Aim for two per sequence; stop at four even if successful, then rest for 20 seconds.',
    rotation:'Three sequences per moving player, with a maximum four cycles each. The two feeders stay in their separate positions until the dead-ball rotation.',
    easier:'B and C stop and catch after A’s shots, then feed the next ball only when A is ready.', harder:'Narrow A’s target to each feeder while retaining the same generous feed height.', mixed:'Set the short/deep distance to A’s mobility and use catch-and-feed pauses whenever needed.',
    safety:'A turns to move back instead of running backwards. Feeders leave generous time and stop immediately if A is rushed or either feeder would need to cross the other’s space.',
    diagram:D('B feeds short from far-left service line to A. A approaches and sends deep to C at far-right baseline. C sends deep to near court; A recovers and returns gently to B.',[P('A',180,383),P('B',115,110),P('C',245,17)],[[115,130,160,270],[160,270,245,65],[245,65,180,335],[180,335,115,135]],[],[[180,383,160,285],[160,285,180,383]])
  },
  {
    id:'passer-front-back-pair', title:'Pass the front-and-back pair', players:[3], level:'Intermediate', type:'Competitive game', focus:['Down the line','Volleys'], suggested:12, minimum:6,
    description:'Find a passing lane against a staggered pair rather than two baseline defenders.',
    setup:'A is alone behind the near baseline. B stands near far-left net and C behind the far-right baseline. Use singles width for all shots so the solo player is not asked to defend doubles width.',
    instructions:['C gently drop-feeds to A. A returns after one bounce, choosing a passing lane away from B.', 'B may intercept a comfortable volley; C covers the backcourt. Play out the point using singles boundaries and at most one bounce.', 'A net ball, out ball or second bounce ends the point. For this practice game no lobs are used; a lob loses the point.', 'After four points rotate A → B, B → C, C → A. Mirror the staggered pair after a complete cycle; finish the current point at time.'],
    scoring:'One point to the solo player or pair winning the rally. Record each player’s four-point solo total; these are custom equal-width practice rules.',
    rotation:'Rotate all roles after four points, regardless of the score. All three are active and change positions only on a dead ball.',
    easier:'B begins farther from the net and C feeds centrally.', harder:'B may start a little nearer the centre while A still uses the full singles width.', mixed:'Give the solo player a slower opening feed and have B use controlled volleys rather than hard put-aways.',
    safety:'B stays clear of C’s forward swing path and calls interceptions. Avoid body passes and abandon balls that create a partner collision risk.',
    diagram:D('Solo A chooses a straight or diagonal pass against B near far-left net and C at far-right baseline. All returns must land inside singles; no lob is used in this game.',[P('A',180,383),P('B',120,160),P('C',245,17)],[[245,65,180,330],[180,330,240,85],[120,175,130,310]],[[85,40,190,65,'T']])
  },
  {
    id:'return-depth-observer', title:'Return depth observation round', players:[3], focus:['Serve and return','Consistency'], suggested:12, minimum:6,
    description:'Separate return depth from point-winning with a dedicated observer and equal role turns.',
    setup:'A serves behind the near baseline, B receives behind the far diagonal baseline and C observes safely outside the near sideline near the service line. T is the near backcourt behind that service line.',
    instructions:['A serves with two attempts. B returns a legal serve after one bounce, aiming beyond the near service line.', 'End on the return’s first bounce. C calls only “deep”, “short” or “out”, using the visible lines, then reports B’s running total.', 'Alternate deuce/ad sides for six attempts. A double fault counts as an attempt with no return score.', 'Rotate A → B, B → C, C → A. Complete the dead-ball change before feeding and finish the current attempt at time.'],
    scoring:'B earns one for an in-court return and another if it lands in T. C reports the two components separately out of six; the serve is not independently verified.',
    rotation:'Six attempts per role. The observer rests from hitting and never retrieves until the ball is dead.',
    easier:'Use a gentle practice serve from closer to the service line and accept the whole near singles court.', harder:'Call a broad left or right backcourt half before each serve.', mixed:'Adjust serving pace to the receiver; the observer gives factual depth feedback rather than coaching claims.',
    safety:'C stands beyond the doubles sideline and outside the return path, with room to retreat. Stop if the observer’s position obstructs play.',
    diagram:D('A serves diagonally to B; B returns towards near backcourt T. C observes from outside the near sideline near the service-line depth reference and does not play the ball.',[P('A',225,383),P('B',110,17),P('C',330,290)],[[225,350,120,155],[110,65,180,325]],[[85,296,190,60,'T']])
  },
  {
    id:'rally-recover-relay', title:'Rally-and-recover relay', players:[3], level:'Intermediate', focus:['Movement','Doubles teamwork'], suggested:12, minimum:6,
    description:'Coordinate alternate hitters while each player recovers through a clear outside route.',
    setup:'A starts behind the near-left baseline, B waits outside the near-right sideline and C feeds from behind the far baseline. A and B alternate hits; use one ball with a catch-and-feed pause between turns.',
    instructions:['C gently feeds to A’s half. A returns centrally; C lets it bounce and catches it, ending this ball. A walks to the right waiting area using a route well behind the baseline.', 'Only after A is clear, B walks into the near-left hitting position. C waits until B is set before feeding the next ball.', 'B returns, C catches after a bounce and B follows the same outside recovery route while A re-enters. Stop if either hitter is not ready.', 'After eight near-side returns or an earlier miss, rest for 20 seconds. After three sequences rotate C → A, A → B, B → C; finish the current attempt at time.'],
    scoring:'Count the alternating pair’s in-court returns, up to eight. A skipped turn or unsafe overlap ends the sequence without a penalty for stopping.',
    rotation:'Alternate A/B on every near-side return, then rotate the solo rally partner after three sequences. Pause for 20 seconds between sequences.',
    easier:'C feeds from nearer the service line, waiting until the next hitter is set.', harder:'Use a narrower central return target while preserving every catch-and-feed pause.', mixed:'Give each hitter a suitable feed height and use the same unhurried rotation for all three.',
    safety:'Never cross in front of the active hitter. Use walking recovery behind the baseline, make the outside route wide and stop rather than racing the next ball.',
    diagram:D('A hits from near-left baseline while B waits outside the near-right sideline. C catches the return after a bounce, then waits as A clears well behind the baseline and B enters the free hitting position. The next feed is a new ball, not a continuous relay rally.',[P('A',115,383),P('B',330,315),P('C',180,17)],[[180,65,115,335],[115,335,180,75]],[],[[115,383,330,383],[330,315,115,383]])
  },
  {
    id:'parallel-lane-pairs', title:'Parallel lane pairs', players:[4], focus:['Down the line','Consistency'], intro:true, suggested:10, minimum:5,
    description:'Run two independent straight rallies with clear lane ownership and safe shared pauses.',
    setup:'A faces C in the left singles half and B faces D in the right singles half, starting near opposite service lines. Use exactly two balls, one per straight lane. The centre line divides the lanes.',
    instructions:['A and B start gentle drop-feeds in their own lanes once both pairs are ready.', 'Each pair rallies after one bounce down its straight lane. Never cross into the other lane or play a ball from it.', 'If either ball leaves its lane, call “stop”; both pairs stop before anyone retrieves. Restart both lanes together.', 'After five shared starts, switch partners to A–D and B–C with the ball dead. Finish both current rallies at time.'],
    scoring:'Each lane counts consecutive returns after its feed. The four-player target is for both lanes to reach six during the same shared start.',
    rotation:'Feeders alternate within each lane after every shared stop. Change partners every five starts; all four remain active.',
    easier:'Start closer to the service lines and use one controlled return followed by a catch.', harder:'Move both pairs towards the baselines while retaining straight lanes.', mixed:'Give the less experienced pair a shorter rally distance; both lanes still obey every shared stop.',
    safety:'Two balls are used only in separated straight lanes. Stop both rallies immediately if either ball crosses centre; do not poach or chase across.',
    diagram:D('A and C rally straight in the left singles half with one ball; B and D use a second ball in the right half. The lanes do not cross. Both stop if either ball crosses the centre division.',[P('A',125,305),P('B',235,305),P('C',125,95),P('D',235,95)],[[115,280,115,130],[140,130,140,280],[225,280,225,130],[250,130,250,280]],[[80,114,100,172,'T1'],[180,114,100,172,'T2']])
  },
  {
    id:'four-corner-one-ball', title:'Four-corner one-ball pattern', players:[4], level:'Intermediate', focus:['Crosscourt','Down the line','Doubles teamwork'], suggested:12, minimum:6,
    description:'Link straight and diagonal groundstrokes so all four players share one predictable pattern.',
    setup:'A and B occupy the near-left and near-right baseline corners; C and D occupy far-left and far-right. Use one ball and singles width, with plenty of space between partners.',
    instructions:['A drop-feeds straight to C. C returns crosscourt to B; B returns straight to D; D returns crosscourt to A.', 'Repeat A → C → B → D → A after one bounce, keeping the ball comfortable for the next player.', 'A miss, wrong receiver, out ball or second bounce ends the sequence. Retrieve and reset before restarting.', 'After four sequences swap near and far team roles so the straight hitters become diagonal hitters. Finish the current sequence at time.'],
    scoring:'Count complete four-shot circuits after the feed. Aim for two circuits with every player contributing before increasing depth.',
    rotation:'Swap ends after four sequences, walking around the net. Alternate the first feeder A/B each sequence and mirror the circuit when B feeds.',
    easier:'Start at the service lines with higher, slower balls.', harder:'Move behind the baselines and aim every shot beyond the opposite service line.', mixed:'Use asymmetric distances so each hitter can send the next player a comfortable ball.',
    safety:'Use one ball and fixed halves. Partners call any middle ball and stop if an unexpected direction would cause a crossing chase.',
    diagram:D('One ball follows A near left to C far left, C to B near right, B to D far right, then D to A. Near players hit straight and far players diagonally; swap ends after four sequences.',[P('A',110,383),P('B',250,383),P('C',110,17),P('D',250,17)],[[110,345,110,65],[110,65,250,345],[250,345,250,65],[250,65,110,345]])
  },
  {
    id:'paired-approach-transition', title:'Paired approach transition', players:[4], level:'Intermediate', focus:['Movement','Volleys','Doubles teamwork'], suggested:12, minimum:6,
    description:'Move forward as a pair after a short ball while keeping shared middle coverage.',
    setup:'A+B start behind the near baseline and C+D behind the far baseline. C has one ball to feed short into A’s near-left half. Use full doubles boundaries.',
    instructions:['C feeds a comfortable short ball to A. A approaches towards C while B moves forward alongside, staying in the other half.', 'C returns a controlled passing ball. A and B split-step and call the next volley; C and D defend from the backcourt.', 'Play out the point using volleys or one bounce. A net ball, out ball or second bounce ends it; no hard body feeds are used.', 'After four points swap attacking and defending teams. Alternate the short-ball receiver A/B and corresponding feeder each point; finish the current point at time.'],
    scoring:'One point for winning the rally. The attacking pair also records whether both reached balanced volley positions before the first defensive reply; that observation is separate from the point.',
    rotation:'Swap attacking/defending roles every four points; both partners share the first approach on alternating attempts.',
    easier:'Defenders send only gentle middle returns and the attackers use broad volley targets.', harder:'Defenders may choose controlled passing shots or lobs once both attackers are balanced.', mixed:'Use a closer starting position for a less mobile attacker and keep feed depth consistent.',
    safety:'Partners stay in separate halves and call middle balls. Turn for lobs rather than backpedalling, and stop if the pair’s forward routes intersect.',
    diagram:D('C feeds short to near-left A. A approaches towards C as partner B advances in the near-right half; C and D defend behind the far baseline. Dashed routes show the pair moving forward together.',[P('A',110,383),P('B',250,383),P('C',110,17),P('D',250,17)],[[110,65,110,290],[110,290,110,75],[110,75,240,245]],[],[[110,383,110,250],[250,383,250,250]])
  },
  {
    id:'doubles-lob-switch-point', title:'Doubles lob switch point', players:[4], level:'Intermediate', type:'Competitive game', focus:['Movement','Doubles teamwork'], suggested:12, minimum:6,
    description:'Turn a defensive lob into a planned partner switch before opening a doubles point.',
    setup:'A starts at near-left net and B behind the near-right baseline. C+D start behind the far baseline. C feeds a gentle lob over A into the near-left backcourt.',
    instructions:['C lobs over A. A calls “switch” and moves to near-right net; B calls “mine”, turns and moves left for the bounce.', 'B sends a controlled return into the far doubles court. Only after that return is the point fully open.', 'Play out the point, ending on a miss, out ball or second bounce. If the opening lob is unreachable, stop and replay safely.', 'After four points exchange near/far roles. Alternate the starting net half each point, then finish the current point at time.'],
    scoring:'One point per completed open rally. Opening feeds and safely abandoned lobs do not score; this is a custom doubles point-start.',
    rotation:'Four points per team in the switching role. Partners alternate net/baseline positions each point so both practise retrieving and covering.',
    easier:'Feed a shorter lob and allow the switching pair to reset before C or D plays the next shot.', harder:'After the lob return, allow the far pair to choose a controlled pass or another lob.', mixed:'Place the less mobile retrieving player nearer the centre and use a more generous feed.',
    safety:'The net player does not chase backwards under the lob. Both call early and stop if the baseline player’s route is blocked.',
    diagram:D('C lobs over near-left net player A. Near-right baseline player B moves left to retrieve after a bounce while A switches to near-right net. B returns to C+D and the doubles point opens.',[P('A',110,240),P('B',250,383),P('C',110,17),P('D',250,17)],[[110,65,110,335],[110,335,230,80]],[],[[110,240,250,240],[250,383,110,383]])
  },
  {
    id:'touch-doubles-boxes', title:'Touch doubles in the boxes', players:[4], type:'Competitive game', focus:['Doubles teamwork','Consistency'], suggested:10, minimum:5,
    description:'Make space with gentle placement while partners protect a compact shared court.',
    setup:'A+B stand just behind the near service line, C+D just behind the far service line. The legal court is only the two service boxes at each end, inside singles width. Use one ball and no volleys.',
    instructions:['A drop-feeds gently into an opposite service box. Every return must bounce once before it is hit.', 'Partners call the ball, protect their separate halves and place returns into either opposite service box.', 'A volley, second bounce, net ball or first bounce outside the service-box area loses the point.', 'Alternate the feeder A → C → B → D each point. After eight points swap partners to AC/BD, then AD/BC after eight more; finish the current point at time.'],
    scoring:'One point per rally. Eight-point rounds may be drawn 4–4. The compact boundaries and compulsory bounce are custom practice rules.',
    rotation:'Feed in the listed four-player order and change partnerships after eight points. All four remain involved through calling and coverage.',
    easier:'Begin cooperatively and count six returns before allowing competitive placement.', harder:'Require a return to a different service box from the previous shot before opening the point.', mixed:'Allow a second bounce for a named less mobile player as an agreed practice adaptation.',
    safety:'Use soft shots, leave room for partners and stop before the net. No hard drives or chasing sharp angles onto another court.',
    diagram:D('A+B cover the near service-box area and C+D the far service-box area. All shots bounce once within shaded T; players stay in separate halves and call middle balls.',[P('A',120,305),P('B',240,305),P('C',120,95),P('D',240,95)],[[120,280,240,150],[240,150,240,250]],[[80,114,200,82,'T'],[80,204,200,82,'T']])
  },
  {
    id:'middle-then-wide-doubles', title:'Middle then wide doubles', players:[4], level:'Intermediate', type:'Competitive game', focus:['Doubles teamwork','Crosscourt'], suggested:12, minimum:6,
    description:'Use a central ball to organise the rally before looking for open space.',
    setup:'A+B share the near baseline and C+D the far baseline. Use one ball and full doubles boundaries. T is the central backcourt strip at each end, about one racket length either side of the centre.',
    instructions:['A drop-feeds centrally. The next four rally shots must land in T beyond the opposite service line, with partners calling responsibility.', 'After four successful central returns, any player may use the full doubles width and the point becomes competitive.', 'A miss during the central opening is replayed without a point. Once open, a miss, out ball or second bounce loses the point.', 'Rotate the feeder A → C → B → D every point attempt. After eight scored points swap left/right halves with partners; finish the current point at time.'],
    scoring:'One point for winning an open rally. Separately count completed four-shot openings to see whether the pair can build a point before attacking.',
    rotation:'All four stay active. Change feeder after each attempt, even if the opening fails, and swap partner halves after eight scored points.',
    easier:'Require two central returns with the whole singles backcourt as the opening target.', harder:'Require six central returns before the point opens, retaining safe pace.', mixed:'Use a wider central target for the less experienced pair without changing the opening shot count.',
    safety:'Partners call early for middle balls and one yields clearly. Avoid hard shots at close opponents and stop when a stray ball enters.',
    diagram:D('A+B and C+D begin at opposite baselines. The first four returns use central backcourt T at each end; after that, a wide ball may open the doubles point.',[P('A',110,383),P('B',250,383),P('C',110,17),P('D',250,17)],[[110,345,180,80],[180,80,180,320],[180,320,250,80]],[[145,40,70,65,'T'],[145,295,70,65,'T']])
  },
  {
    id:'return-and-charge-pair', title:'Return and charge pair', players:[4], level:'Intermediate', focus:['Serve and return','Volleys','Doubles teamwork'], suggested:12, minimum:6,
    description:'Coordinate a forward-moving returner with a partner already guarding the net.',
    setup:'A serves from the near baseline with B at near-left net. C receives deuce at the far-left baseline with D at far-right net. Use doubles boundaries after the serve.',
    instructions:['A serves with two attempts into the diagonal service box. C returns under control towards the near backcourt and moves forward in the far-left half.', 'D stays in the far-right half and calls any shared middle ball. The receiving pair aims to form balanced side-by-side net positions.', 'Play out the doubles point; a double fault, other miss, out ball or second bounce ends it.', 'Play four points alternating deuce/ad; C and D take their respective returns and the receiver is the player who advances. Swap serving and receiving teams after four points; finish the current point at time.'],
    scoring:'One point per rally. The receiving team separately counts balanced approaches after legal returns, without claiming every forward move is tactically best.',
    rotation:'Four points per receiving round. Partners keep their receiving sides for that round; next serving round uses the other partner as server.',
    easier:'Use a gentle serve and let the returner begin a step inside the baseline.', harder:'The serving team may choose a controlled low ball or lob after the return.', mixed:'Keep serving pace suitable for the receiver and allow an agreed slower transition before the next shot.',
    safety:'The advancing receiver stays in their half and split-steps before the next shot. Partners call middle balls and turn rather than backpedal on lobs.',
    diagram:D('A serves from near deuce to C at far left. C returns deep and advances in the far-left half beside net partner D. B begins near-left net; serving and receiving teams exchange roles after four points.',[P('A',225,383),P('B',110,240),P('C',110,17),P('D',250,160)],[[225,350,120,155],[110,65,220,320]],[],[[110,17,110,150]])
  },
  {
    id:'alley-pass-and-protect', title:'Alley pass and protect', players:[4], level:'Intermediate', type:'Competitive game', focus:['Volleys','Doubles teamwork','Down the line'], suggested:12, minimum:6,
    description:'Practise a controlled passing lane while a net pair protects the doubles alleys.',
    setup:'A+B begin behind the near baseline, C+D just inside the far service line. Use the full doubles court. T1 and T2 are the far left and right doubles alleys, beyond the far service line.',
    instructions:['A starts with a gentle underarm racket feed to C. C volleys a comfortable ball back to the near court.', 'After that first controlled volley the point opens. A+B may aim for an alley pass; C+D defend and volley with clear calls.', 'A net ball, out ball or second bounce ends the point. No hard body passes or lobs are used in this custom game.', 'Alternate first feeders A/B for four points, then exchange baseline/net team roles. Finish the current point when time ends.'],
    scoring:'One point for winning a rally, or two instead if the winning ball first bounces in a far alley target when the baseline team hits it. State the bonus before starting.',
    rotation:'Swap baseline and net roles every four points; net partners alternate who receives the opening feed.',
    easier:'Use singles-width targets beside the net players rather than the narrow alleys.', harder:'Keep the alley targets and begin the baseline pair farther back, without raising pace.', mixed:'Offer a larger passing target to the less experienced baseline hitter while both net players use controlled volleys.',
    safety:'Use placement rather than power, do not drive at bodies and stop if a net player is too close for a safe pass.',
    diagram:D('Near-baseline A+B face far-net C+D. After a gentle feed and volley, the baseline pair can seek a pass into far doubles-alley T1 or T2. Targets are outside singles but inside doubles.',[P('A',110,383),P('B',250,383),P('C',110,150),P('D',250,150)],[[110,345,110,165],[110,165,220,325],[220,325,295,75]],[[55,40,25,65,'T1'],[280,40,25,65,'T2']])
  },
  {
    id:'pressure-point-team-budget', title:'Pressure points with a team budget', players:[4], type:'Match format', focus:['Doubles teamwork','Serve and return'], suggested:14, minimum:6,
    description:'Choose when to use a limited bonus point and discuss a simple plan with a partner.',
    setup:'Start A+B against C+D using normal doubles boundaries. Each pair has one optional bonus call per eight-point round. Agree the intended serve/return plan aloud before the point.',
    instructions:['Play exactly eight points, serving two points each in order A → C → B → D. Alternate deuce/ad within each service turn and allow two serve attempts.', 'Before any point either pair may say “bonus”, spending its one bonus call for this round. A point is worth two only if that calling pair wins it; otherwise the opponents receive the usual one.', 'Play out each point with volleys or one bounce; a double fault, miss, out ball or second bounce loses it. Both pairs may call their own bonus on the same point.', 'After eight points change partners AB/CD → AC/BD → AD/BC, reset bonus calls and restart the listed two-point serving order with the new partners placed on opposite ends. Finish the current point at time.'],
    scoring:'Count one for each ordinary winning point and two for a calling pair winning its bonus point. Drawn rounds stand. This is a custom decision game, not official tiebreak scoring.',
    rotation:'All four serve twice per round. Change partnerships after eight points; each pair chooses fixed deuce/ad receiving sides for that round.',
    easier:'Keep the eight-point rotation but remove the bonus; discuss one safe placement goal before each service turn.', harder:'Before spending the bonus, the pair must state a concrete broad target and coverage plan; the bonus still depends only on winning the point.', mixed:'Use comfortable serving pace or an agreed underarm serve; keep the same bonus allowance and equal two-point service turns.',
    safety:'Discuss the plan only with a dead ball, keep partner swing areas clear and prioritise controlled placement over body shots.',
    diagram:D('A serves near deuce with B at net, against C receiving and D at net. The teams may make one pre-point bonus call per eight-point round; this changes scoring, not court boundaries.',[P('A',225,383),P('B',110,240),P('C',110,17),P('D',250,160)],[[225,350,120,155],[110,65,220,320]])
  }
];

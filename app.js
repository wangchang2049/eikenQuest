const TEST_SIZE = 65;
const TEST_SECONDS = 65 * 60;
const EXAM_BLUEPRINT = [
  { key: "vocabulary", section: "語彙", label: "語彙", detail: "短文の語句空所補充", count: 15, pill: "purple" },
  { key: "conversation", section: "会話", label: "会話", detail: "会話文の文空所補充", count: 5, pill: "cyan" },
  { key: "ordering", section: "整序", label: "整序", detail: "日本文付き短文の語句整序", count: 5, pill: "amber" },
  { key: "reading", section: "読解", label: "読解", detail: "長文の内容一致選択", count: 10, pill: "green" },
  { key: "listening1", section: "聴解1", label: "聴解1", detail: "会話の応答文選択", count: 10, pill: "pink" },
  { key: "listening2", section: "聴解2", label: "聴解2", detail: "会話の内容一致選択", count: 10, pill: "pink" },
  { key: "listening3", section: "聴解3", label: "聴解3", detail: "文の内容一致選択", count: 10, pill: "pink" }
];

const vocabularyBank = [
  ["I usually eat breakfast at seven (    ).", ["clock", "o'clock", "time", "hour"], 1, "時刻を表すときは seven o'clock が自然です。"],
  ["My sister can play the piano very (    ).", ["well", "good", "nice", "happy"], 0, "動詞 play を説明する副詞 well を使います。"],
  ["Tom is absent from school today.", ["学校にいる", "学校を休んでいる", "学校へ急いでいる", "学校で勉強している"], 1, "be absent from school は「学校を休んでいる」という意味です。"],
  ["Please (    ) your name here.", ["write", "read", "speak", "listen"], 0, "名前を書く場面なので write が合います。"],
  ["The box is too heavy. I can't (    ) it.", ["carry", "cook", "open", "watch"], 0, "heavy とあるので「運ぶ」の carry が自然です。"],
  ["We have English class on (    ).", ["Monday", "tennis", "summer", "kitchen"], 0, "曜日を表す Monday が入ります。"],
  ["I am thirsty. I want some (    ).", ["water", "paper", "music", "homework"], 0, "thirsty は「のどがかわいた」なので water が合います。"],
  ["My father is a doctor. He works at a (    ).", ["hospital", "station", "library", "farm"], 0, "doctor が働く場所は hospital です。"],
  ["This question is not easy. It is (    ).", ["difficult", "small", "early", "quiet"], 0, "not easy は difficult と近い意味です。"],
  ["I (    ) my teeth after breakfast.", ["brush", "ride", "draw", "close"], 0, "歯をみがくは brush my teeth です。"],
  ["Let's meet in front of the (    ). We can borrow books there.", ["library", "pool", "zoo", "post office"], 0, "本を借りる場所は library です。"],
  ["A (    ) has a long neck.", ["giraffe", "rabbit", "fish", "bird"], 0, "首が長い動物は giraffe です。"],
  ["I was very (    ), so I went to bed early.", ["tired", "round", "cloudy", "cheap"], 0, "早く寝た理由として tired が自然です。"],
  ["Ken (    ) a letter to his grandmother yesterday.", ["sent", "bought", "swam", "slept"], 0, "letter と相性がよい動詞は sent です。"],
  ["Spring comes after (    ).", ["winter", "summer", "Sunday", "breakfast"], 0, "春の前は冬です。"],
  ["My uncle lives in Canada. He can speak (    ).", ["English", "science", "soccer", "piano"], 0, "speak の目的語として言語の English が合います。"],
  ["There are twelve (    ) in a year.", ["months", "hours", "days", "minutes"], 0, "1年は12か月です。"],
  ["She (    ) her room every Sunday.", ["cleans", "drinks", "wears", "runs"], 0, "room と組み合わせるなら cleans が自然です。"],
  ["This cap is (    ) than that one.", ["newer", "new", "newest", "newly"], 0, "than があるので比較級 newer を使います。"],
  ["I want to be a (    ) because I like teaching children.", ["teacher", "pilot", "cook", "singer"], 0, "子どもに教える仕事は teacher です。"],
  ["The train will (    ) at three thirty.", ["arrive", "wash", "invite", "climb"], 0, "電車が到着するは arrive です。"],
  ["Please speak (    ). I can't hear you.", ["louder", "older", "colder", "shorter"], 0, "聞こえないので louder が自然です。"],
  ["I bought a (    ) of shoes yesterday.", ["pair", "cup", "piece", "glass"], 0, "靴は a pair of shoes と数えます。"],
  ["The children are playing (    ) in the park.", ["baseball", "breakfast", "homework", "letter"], 0, "公園で遊ぶものとして baseball が合います。"],
  ["I have to (    ) for the test tonight.", ["study", "sleep", "dance", "snow"], 0, "テストのために勉強するので study です。"]
].map(([prompt, choices, answer, explanation]) => ({
  section: "語彙",
  title: "空所または意味に合う最もよい答えを選びなさい。",
  prompt,
  choices,
  answer,
  explanation
}));

const conversationBank = [
  ["A: How was your weekend?\nB: (    )", ["It was great.", "It is on the desk.", "At three o'clock.", "Yes, I do."], 0, "週末の感想を聞かれているので It was great. が自然です。"],
  ["A: Whose bag is this?\nB: (    )", ["It is Ken's.", "It is sunny.", "I am twelve.", "I like bags."], 0, "Whose は「だれの」という意味なので所有者を答えます。"],
  ["A: May I use your pen?\nB: (    )", ["Sure. Here you are.", "I am fine.", "It is Monday.", "No, I don't."], 0, "許可を求められた場面では Sure. Here you are. が自然です。"],
  ["A: What time do you get up?\nB: (    )", ["At six thirty.", "In the kitchen.", "With my brother.", "Because I like it."], 0, "What time には時刻で答えます。"],
  ["A: Would you like some tea?\nB: (    )", ["Yes, please.", "It is blue.", "I am reading.", "On foot."], 0, "勧められたものを受けるときは Yes, please. が自然です。"],
  ["A: Where is the nearest station?\nB: (    )", ["Go straight and turn left.", "I like trains.", "It is ten years old.", "No, she isn't."], 0, "場所を聞かれているので道案内が合います。"],
  ["A: How many brothers do you have?\nB: (    )", ["I have two.", "They are bags.", "It is mine.", "At school."], 0, "How many には数で答えます。"],
  ["A: Let's play tennis after school.\nB: (    )", ["Sounds good.", "It is a pen.", "I am in Japan.", "No, it isn't."], 0, "誘いに賛成する返事として Sounds good. が自然です。"],
  ["A: What are you doing?\nB: (    )", ["I am making lunch.", "I made lunch yesterday.", "I will be a teacher.", "I can lunch."], 0, "What are you doing? には現在進行形で答えます。"],
  ["A: Did you watch TV last night?\nB: (    )", ["Yes, I did.", "Yes, I am.", "Yes, I can.", "Yes, I was."], 0, "Did で聞かれているので did で答えます。"],
  ["A: Who is that girl?\nB: (    )", ["She is my cousin.", "It is new.", "They are apples.", "On Sunday."], 0, "Who は人を聞く疑問詞です。"],
  ["A: Can you help me?\nB: (    )", ["Of course.", "It is cloudy.", "I am eleven.", "By bus."], 0, "手伝いを頼まれたときの返事として Of course. が自然です。"],
  ["A: How do you go to school?\nB: (    )", ["By bike.", "At seven.", "With math.", "It is mine."], 0, "How は通学方法を聞いているので By bike. が合います。"],
  ["A: Happy birthday!\nB: (    )", ["Thank you.", "You're welcome.", "I'm sorry.", "Excuse me."], 0, "お祝いを言われたら Thank you. と返します。"],
  ["A: What is your favorite sport?\nB: (    )", ["I like soccer best.", "It is under the chair.", "I go on Monday.", "I am from Osaka."], 0, "好きなスポーツを答える文が合います。"],
  ["A: Why are you late?\nB: (    )", ["Because I missed the bus.", "At the park.", "It is red.", "For two hours."], 0, "Why には理由を答えます。"],
  ["A: How much is this notebook?\nB: (    )", ["It is 200 yen.", "It is easy.", "It is mine.", "It is Monday."], 0, "How much は値段を聞く表現です。"],
  ["A: See you tomorrow.\nB: (    )", ["See you.", "Nice to meet you.", "I am hungry.", "No, thanks."], 0, "別れのあいさつには See you. が自然です。"],
  ["A: Is this seat free?\nB: (    )", ["Yes, please sit down.", "I like free time.", "It is my book.", "At the station."], 0, "席が空いているか聞かれているので座ってよいと答えます。"],
  ["A: Which do you want, milk or juice?\nB: (    )", ["Juice, please.", "Yes, I do.", "It is cold.", "I want to go."], 0, "A or B の質問には選んで答えます。"]
].map(([prompt, choices, answer, explanation]) => ({
  section: "会話",
  title: "会話が自然になるように選びなさい。",
  prompt,
  choices,
  answer,
  explanation
}));

const readingBank = [
  {
    passage: "Emma likes animals very much. Every Saturday morning, she goes to the park with her father. They feed the birds and walk their dog, Lucky. After that, they buy bread at a small shop near the park.",
    items: [
      ["What does Emma do every Saturday morning?", ["She goes to the park.", "She studies math.", "She cleans her room.", "She visits her grandmother."], 0, "本文に Every Saturday morning, she goes to the park とあります。"],
      ["What do Emma and her father buy after going to the park?", ["Bread", "Milk", "A dog", "A book"], 0, "After that, they buy bread と書かれています。"]
    ]
  },
  {
    passage: "Yuta has a school festival next week. His class will make curry and rice. Yuta will buy carrots and potatoes with his friends after school today. He is very excited.",
    items: [
      ["What will Yuta's class make?", ["Curry and rice", "Sandwiches", "Cake", "Soup"], 0, "His class will make curry and rice とあります。"],
      ["When will Yuta buy vegetables?", ["After school today", "Next Sunday", "Tomorrow morning", "During lunch"], 0, "after school today と書かれています。"]
    ]
  },
  {
    passage: "Miki got an e-mail from her friend Lisa in Australia. Lisa says it is summer there now. Miki wants to send Lisa a picture of snow because it is winter in Japan.",
    items: [
      ["Where does Lisa live?", ["Australia", "Japan", "Canada", "India"], 0, "Lisa in Australia とあります。"],
      ["What does Miki want to send?", ["A picture of snow", "A summer hat", "An e-mail from Canada", "A Japanese book"], 0, "send Lisa a picture of snow と書かれています。"]
    ]
  },
  {
    passage: "Ben works at a small bakery on Sundays. He starts work at eight in the morning. He puts bread on the shelves and cleans the tables. His favorite bread is melon bread.",
    items: [
      ["Where does Ben work on Sundays?", ["At a bakery", "At a hospital", "At a station", "At a school"], 0, "bakery はパン屋です。"],
      ["What is Ben's favorite bread?", ["Melon bread", "French bread", "Rice bread", "Banana bread"], 0, "His favorite bread is melon bread とあります。"]
    ]
  },
  {
    passage: "Saki's family went camping by a lake. In the afternoon, Saki and her brother caught three fish. At night, they looked at the stars. Saki wants to go camping again.",
    items: [
      ["How many fish did Saki and her brother catch?", ["Three", "Two", "Four", "Five"], 0, "caught three fish と書かれています。"],
      ["What did they do at night?", ["They looked at the stars.", "They swam in the lake.", "They played soccer.", "They cooked breakfast."], 0, "At night, they looked at the stars とあります。"]
    ]
  },
  {
    passage: "Taro is in the music club. He practices the guitar every Wednesday. The club will have a concert in July. Taro will play two songs with his friends.",
    items: [
      ["What instrument does Taro practice?", ["The guitar", "The piano", "The violin", "The drums"], 0, "practices the guitar とあります。"],
      ["When will the club have a concert?", ["In July", "In June", "Every Wednesday", "Tomorrow"], 0, "have a concert in July と書かれています。"]
    ]
  },
  {
    passage: "Nina's mother is a nurse. She often works at night. On days off, she cooks lunch with Nina. Nina likes making salad because she can use many colors of vegetables.",
    items: [
      ["What is Nina's mother's job?", ["A nurse", "A teacher", "A cook", "A driver"], 0, "Nina's mother is a nurse とあります。"],
      ["Why does Nina like making salad?", ["She can use many colors of vegetables.", "She can eat fish.", "It is hot.", "It is easy to buy."], 0, "many colors of vegetables が理由です。"]
    ]
  },
  {
    passage: "Hiro lost his cap at school yesterday. It is blue and has a white star on it. This morning, his teacher found it in the gym. Hiro was very happy.",
    items: [
      ["What color is Hiro's cap?", ["Blue", "White", "Black", "Green"], 0, "It is blue と書かれています。"],
      ["Where did the teacher find the cap?", ["In the gym", "In the library", "Near the station", "At home"], 0, "found it in the gym とあります。"]
    ]
  },
  {
    passage: "Aya visits her grandmother every month. Her grandmother lives near the sea. They walk on the beach and collect shells. Aya keeps the shells in a small box.",
    items: [
      ["How often does Aya visit her grandmother?", ["Every month", "Every day", "Every week", "Every year"], 0, "every month とあります。"],
      ["What does Aya collect?", ["Shells", "Stamps", "Leaves", "Pictures"], 0, "collect shells と書かれています。"]
    ]
  },
  {
    passage: "The city library has a reading day on the first Saturday of every month. Children can listen to stories in English. This month, the story starts at two o'clock.",
    items: [
      ["Where is the reading day?", ["At the city library", "At a park", "At a museum", "At school"], 0, "The city library has a reading day とあります。"],
      ["What time does the story start this month?", ["At two o'clock", "At one o'clock", "At three thirty", "At four o'clock"], 0, "starts at two o'clock と書かれています。"]
    ]
  }
].flatMap((group) => group.items.map(([prompt, choices, answer, explanation]) => ({
  section: "読解",
  title: "英文を読んで質問に答えなさい。",
  prompt,
  passage: group.passage,
  choices,
  answer,
  explanation
})));

const orderingBank = [
  ["私は昨日、図書館へ行きました。", "I (    ) yesterday.", ["went to the library", "to the library went", "library to went", "went the library to"], 0, "「図書館へ行った」は went to the library の順です。"],
  ["彼女は毎朝、英語を勉強します。", "She (    ) every morning.", ["studies English", "English studies", "study English", "studies the English"], 0, "主語が She なので studies English の順です。"],
  ["あなたは何時に起きますか。", "(    ) get up?", ["What time do you", "Do what time you", "What you do time", "You what time do"], 0, "時刻を聞く疑問文は What time do you ...? です。"],
  ["私はその赤いかばんがほしいです。", "I (    ).", ["want that red bag", "that red bag want", "want red that bag", "that want red bag"], 0, "「その赤いかばんがほしい」は want that red bag です。"],
  ["健は放課後にサッカーをします。", "Ken (    ) after school.", ["plays soccer", "soccer plays", "play soccer", "plays the soccer"], 0, "スポーツをするは play soccer、三人称単数なので plays です。"],
  ["これは私の母が作ったケーキです。", "This is (    ).", ["a cake my mother made", "my mother made a cake", "made my mother a cake", "a cake made my mother"], 0, "名詞を後ろから説明して a cake my mother made となります。"],
  ["駅まで歩いて行きましょう。", "Let's (    ) the station.", ["walk to", "to walk", "walk at", "walking to"], 0, "「駅まで歩く」は walk to the station です。"],
  ["あなたのお兄さんは背が高いですか。", "(    ) tall?", ["Is your brother", "Your brother is", "Does your brother", "Are your brother"], 0, "be動詞の疑問文は Is your brother tall? です。"],
  ["私は何か冷たいものを飲みたいです。", "I want (    ).", ["something cold to drink", "cold something drink to", "to drink something cold", "something to cold drink"], 0, "「飲むための冷たいもの」は something cold to drink です。"],
  ["彼らは公園で写真を撮りました。", "They (    ) in the park.", ["took pictures", "pictures took", "take pictures", "took the pictures"], 0, "「写真を撮った」は took pictures です。"]
].map(([japanese, prompt, choices, answer, explanation]) => ({
  section: "整序",
  title: "日本文の意味に合うように、最もよい語順を選びなさい。",
  prompt: `${japanese}\n${prompt}`,
  choices,
  answer,
  explanation
}));

const listeningBank = [
  ["Girl: I have two tickets for the soccer game. Can you come with me on Sunday? Boy: Sorry, I have to visit my aunt. How about next time?", "What is true?", ["The girl has soccer tickets.", "The boy will go on Sunday.", "The boy has two tickets.", "They will visit the aunt together."], 0, "女の子が I have two tickets と言っています。"],
  ["Mother: It is raining now. Take your umbrella, Mike. Mike: OK, Mom. Where is it? Mother: It is by the door.", "What does Mike need?", ["An umbrella", "A notebook", "A ticket", "A camera"], 0, "雨が降っていて、母親が傘を持って行くように言っています。"],
  ["Teacher: Please bring your science book tomorrow. Student: Do we need a notebook too? Teacher: No, just the book.", "What should the student bring?", ["A science book", "A notebook", "A lunch box", "A dictionary"], 0, "No, just the book. なので必要なのは理科の本だけです。"],
  ["Boy: What time does the movie start? Girl: It starts at four, but let's meet at three thirty.", "When will they meet?", ["At three thirty", "At four", "At two thirty", "At five"], 0, "meet at three thirty と言っています。"],
  ["Man: Excuse me. Is this bus going to the museum? Woman: No. Please take bus number eight.", "Which bus should the man take?", ["Bus number eight", "This bus", "Bus number five", "A train"], 0, "bus number eight に乗るよう言われています。"],
  ["Girl: I can't find my math notebook. Boy: Is it in your desk? Girl: Oh, yes. Thank you.", "Where is the notebook?", ["In her desk", "In her bag", "On the chair", "At home"], 0, "in your desk と確認して見つかっています。"],
  ["Father: What do you want for dinner? Boy: I want spaghetti. Father: OK. Let's make it together.", "What will they make?", ["Spaghetti", "Curry", "Salad", "Sandwiches"], 0, "I want spaghetti と言っています。"],
  ["Woman: The museum is closed on Mondays. Boy: Then let's go there on Tuesday.", "When will they go to the museum?", ["Tuesday", "Monday", "Friday", "Sunday"], 0, "Tuesday に行こうと言っています。"],
  ["Girl: Your dog is cute. What is his name? Boy: His name is Max. He is five years old.", "How old is Max?", ["Five", "Four", "Six", "Ten"], 0, "He is five years old と言っています。"],
  ["Teacher: We will clean the classroom after lunch. Please do not go home early.", "What will the students do after lunch?", ["Clean the classroom", "Go home", "Eat breakfast", "Play in the park"], 0, "after lunch に教室を掃除します。"],
  ["Boy: I bought this book yesterday. It was 600 yen. Girl: I want to read it after you.", "How much was the book?", ["600 yen", "300 yen", "500 yen", "800 yen"], 0, "It was 600 yen と言っています。"],
  ["Mother: The party starts at six. Please come home by five. Girl: OK, I will.", "When should the girl come home?", ["By five", "At six", "After seven", "At noon"], 0, "by five までに帰るよう言われています。"],
  ["Boy: I like winter because I can ski. Girl: I like summer because I can swim in the sea.", "Why does the girl like summer?", ["She can swim in the sea.", "She can ski.", "She can read books.", "She can make soup."], 0, "summer が好きな理由は海で泳げるからです。"],
  ["Man: This train stops at Green Station and East Station. It does not stop at River Station.", "Where does this train not stop?", ["River Station", "Green Station", "East Station", "North Station"], 0, "River Station には止まらないと言っています。"],
  ["Girl: Let's buy flowers for Ms. Brown. Boy: Good idea. She likes yellow flowers.", "What color flowers does Ms. Brown like?", ["Yellow", "Blue", "Red", "White"], 0, "yellow flowers が好きです。"],
  ["Doctor: You should drink water and sleep well today. Boy: Can I play soccer? Doctor: Not today.", "What should the boy do today?", ["Drink water and sleep well", "Play soccer", "Go shopping", "Study all night"], 0, "水を飲んでよく寝るよう言われています。"],
  ["Girl: I will go to Kyoto with my family next week. Boy: Will you go by train? Girl: No, by car.", "How will the girl go to Kyoto?", ["By car", "By train", "By bus", "By plane"], 0, "No, by car. と答えています。"],
  ["Woman: Please put the apples in this bag and the oranges in that box.", "Where should the apples go?", ["In this bag", "In that box", "On the table", "In the kitchen"], 0, "apples は this bag に入れます。"],
  ["Boy: I have a headache. Teacher: Please go to the nurse's room.", "Where should the boy go?", ["The nurse's room", "The library", "The gym", "The station"], 0, "nurse's room に行くよう言われています。"],
  ["Girl: I finished my homework, so I can watch TV now. Mother: For thirty minutes, OK?", "How long can the girl watch TV?", ["For thirty minutes", "For ten minutes", "For one hour", "All night"], 0, "For thirty minutes と言われています。"]
].map(([audioText, prompt, choices, answer, explanation]) => ({
  section: "聴解2",
  title: "音声を聞いて、内容に合う最もよい答えを選びなさい。",
  prompt,
  audioText,
  choices,
  answer,
  explanation
}));

const listeningResponseBank = [
  ["Boy: I lost my pencil. Girl: (    )", "What is the best response?", ["You can use mine.", "It is sunny today.", "I like soccer."], 0, "鉛筆をなくした相手への返事なので You can use mine. が自然です。"],
  ["Girl: Thank you for helping me. Boy: (    )", "What is the best response?", ["You're welcome.", "I am ten.", "At school."], 0, "お礼への返事は You're welcome. です。"],
  ["Mother: Please clean your room. Boy: (    )", "What is the best response?", ["OK, Mom.", "I like rooms.", "It is blue."], 0, "依頼への返事として OK, Mom. が自然です。"],
  ["Man: Excuse me, where is the post office? Woman: (    )", "What is the best response?", ["It is next to the bank.", "I bought stamps.", "It is delicious."], 0, "場所を聞かれているので所在地を答えます。"],
  ["Girl: Can you come to my party? Boy: (    )", "What is the best response?", ["Yes, I'd love to.", "It is my party.", "I can swim."], 0, "招待への返事として Yes, I'd love to. が自然です。"],
  ["Teacher: Open your books to page ten. Student: (    )", "What is the best response?", ["All right.", "I am hungry.", "It is mine."], 0, "指示への返事として All right. が合います。"],
  ["Boy: Happy New Year! Girl: (    )", "What is the best response?", ["Happy New Year!", "Nice to meet you.", "I'm sorry."], 0, "新年のあいさつには同じように返します。"],
  ["Woman: Would you like some cake? Boy: (    )", "What is the best response?", ["Yes, please.", "It is on Sunday.", "I am cake."], 0, "勧められたものを受ける返事です。"],
  ["Girl: I have a test tomorrow. Boy: (    )", "What is the best response?", ["Good luck.", "It is a test.", "I watched TV."], 0, "試験前の相手には Good luck. が自然です。"],
  ["Father: Don't run in the kitchen. Girl: (    )", "What is the best response?", ["Sorry, I won't.", "Yes, I run.", "In the kitchen."], 0, "注意された場面なので謝って返します。"]
].map(([audioText, prompt, choices, answer, explanation]) => ({
  section: "聴解1",
  title: "会話を聞き、最後の発話に対する応答として最もよいものを選びなさい。",
  prompt,
  audioText,
  choices,
  answer,
  explanation
}));

const listeningPassageBank = [
  ["Meg gets up at six every morning. She feeds her cat before breakfast. Today, she gave the cat fish.", "What did Meg give her cat today?", ["Fish", "Milk", "Bread", "Chicken"], 0, "Today, she gave the cat fish. とあります。"],
  ["The new sports center opens next Saturday. It has a pool and three tennis courts. Children can use it for free in May.", "What can children do in May?", ["Use the center for free", "Buy tennis rackets", "Open a pool", "Play only soccer"], 0, "Children can use it for free in May. とあります。"],
  ["Jun will visit his cousin this weekend. His cousin lives in a town near the mountains. Jun wants to take pictures there.", "Where does Jun's cousin live?", ["Near the mountains", "Near the sea", "In a big city", "Next to a library"], 0, "near the mountains と言っています。"],
  ["There is a small music festival at the park today. It starts at two and ends at five. Many students will sing on the stage.", "What time does the festival end?", ["At five", "At two", "At four", "At seven"], 0, "ends at five とあります。"],
  ["Lisa made cookies for her class. She made thirty cookies, but she ate two at home. She will take twenty-eight cookies to school.", "How many cookies will Lisa take to school?", ["Twenty-eight", "Thirty", "Two", "Twenty"], 0, "学校へ持って行くのは twenty-eight cookies です。"],
  ["Tom's family went to the zoo on Sunday. Tom liked the monkeys best because they were very funny.", "What animals did Tom like best?", ["Monkeys", "Lions", "Birds", "Elephants"], 0, "Tom liked the monkeys best とあります。"],
  ["The school bus was late this morning because of snow. The students arrived at school at nine fifteen.", "Why was the bus late?", ["Because of snow", "Because of rain", "Because of traffic lights", "Because of a game"], 0, "because of snow と言っています。"],
  ["Anna needs a blue notebook for science class. She will buy one at the shop after lunch.", "What does Anna need?", ["A blue notebook", "A red pen", "A science book", "A lunch box"], 0, "blue notebook が必要です。"],
  ["Mr. Green teaches English at a junior high school. On weekends, he plays the guitar with his friends.", "What does Mr. Green do on weekends?", ["He plays the guitar.", "He teaches math.", "He reads newspapers.", "He goes fishing."], 0, "週末はギターを弾くと言っています。"],
  ["The city pool is closed today. It will open again tomorrow morning at ten.", "When will the pool open again?", ["Tomorrow morning", "This afternoon", "Next week", "Tonight"], 0, "tomorrow morning at ten に再開します。"]
].map(([audioText, prompt, choices, answer, explanation]) => ({
  section: "聴解3",
  title: "短い文を聞き、内容に合う最もよい答えを選びなさい。",
  prompt,
  audioText,
  choices,
  answer,
  explanation
}));

const questionPools = {
  vocabulary: vocabularyBank,
  conversation: conversationBank,
  ordering: orderingBank,
  reading: readingBank,
  listening1: listeningResponseBank,
  listening2: listeningBank,
  listening3: listeningPassageBank
};

const state = {
  questions: [],
  current: 0,
  answers: [],
  submitted: false,
  started: false,
  remainingSeconds: TEST_SECONDS
};

const timerEl = document.getElementById("timer");
const answeredCountEl = document.getElementById("answeredCount");
const totalCountEl = document.getElementById("totalCount");
const questionNavEl = document.getElementById("questionNav");
const sectionLabelEl = document.getElementById("sectionLabel");
const questionNumberEl = document.getElementById("questionNumber");
const questionTitleEl = document.getElementById("questionTitle");
const questionPromptEl = document.getElementById("questionPrompt");
const audioControlsEl = document.getElementById("audioControls");
const audioStatusEl = document.getElementById("audioStatus");
const passageEl = document.getElementById("passage");
const choicesEl = document.getElementById("choices");
const resultPanelEl = document.getElementById("resultPanel");
const resultSummaryEl = document.getElementById("resultSummary");
const resultStatsEl = document.getElementById("resultStats");
const reviewListEl = document.getElementById("reviewList");
const resultQuestionNavEl = document.getElementById("resultQuestionNav");
const resultCorrectCountEl = document.getElementById("resultCorrectCount");
const resultTotalCountEl = document.getElementById("resultTotalCount");
const startScreenEl = document.getElementById("startScreen");
const appRootEl = document.getElementById("appRoot");
const resultScreenEl = document.getElementById("resultScreen");
const sectionStatsEl = document.getElementById("sectionStats");

document.getElementById("startBtn").addEventListener("click", () => {
  state.started = true;
  startScreenEl.hidden = true;
  appRootEl.hidden = false;
  render();
  updateTimer();
  window.scrollTo({ top: 0, behavior: "auto" });
});
document.getElementById("prevBtn").addEventListener("click", () => moveQuestion(-1));
document.getElementById("nextBtn").addEventListener("click", () => moveQuestion(1));
document.getElementById("submitBtn").addEventListener("click", submitTest);
document.getElementById("resetBtn").addEventListener("click", resetTest);
document.getElementById("playAudioBtn").addEventListener("click", playCurrentAudio);
document.getElementById("backToTestBtn").addEventListener("click", () => {
  resultScreenEl.hidden = true;
  appRootEl.hidden = false;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

function prepareNewTest() {
  stopAudio();
  state.questions = EXAM_BLUEPRINT.flatMap((part) => {
    return shuffle(questionPools[part.key]).slice(0, part.count);
  });
  state.current = 0;
  state.answers = Array(state.questions.length).fill(null);
  state.submitted = false;
  state.started = false;
  state.remainingSeconds = TEST_SECONDS;
  totalCountEl.textContent = state.questions.length;
  resultScreenEl.hidden = true;
  resultStatsEl.innerHTML = "";
  resultQuestionNavEl.innerHTML = "";
  reviewListEl.innerHTML = "";
  renderStartStats();
  if (!appRootEl.hidden) {
    render();
  }
  updateTimer();
}

function render() {
  const question = state.questions[state.current];

  answeredCountEl.textContent = state.answers.filter((answer) => answer !== null).length;
  sectionLabelEl.textContent = question.section;
  questionNumberEl.textContent = `第${state.current + 1}問`;
  questionTitleEl.textContent = question.title;
  questionPromptEl.textContent = question.prompt;

  if (question.audioText) {
    audioControlsEl.hidden = false;
    audioStatusEl.textContent = "speechSynthesis" in window ? "音声を聞いてから答えてください。" : "このブラウザは音声再生に対応していません。";
  } else {
    audioControlsEl.hidden = true;
  }

  if (question.passage) {
    passageEl.hidden = false;
    passageEl.textContent = question.passage;
  } else {
    passageEl.hidden = true;
    passageEl.textContent = "";
  }

  questionNavEl.innerHTML = state.questions.map((_, index) => {
    const resultClass = state.submitted
      ? state.answers[index] === state.questions[index].answer ? "correct" : "wrong"
      : "";
    const classes = [
      "nav-dot",
      index === state.current ? "current" : "",
      state.answers[index] !== null ? "answered" : "",
      resultClass
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-index="${index}" aria-label="第${index + 1}問">${index + 1}</button>`;
  }).join("");

  choicesEl.innerHTML = question.choices.map((choice, index) => {
    const selected = state.answers[state.current] === index;
    return `
      <label class="choice${selected ? " selected" : ""}">
        <input type="radio" name="choice" value="${index}" ${selected ? "checked" : ""}>
        <span>${choice}</span>
      </label>
    `;
  }).join("");

  document.getElementById("prevBtn").disabled = state.current === 0;
  document.getElementById("nextBtn").textContent = state.current === state.questions.length - 1 ? "見直しへ" : "次へ";

  document.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      if (state.submitted && state.answers[index] !== state.questions[index].answer) {
        scrollToReview(index);
        return;
      }
      stopAudio();
      state.current = index;
      render();
    });
  });

  choicesEl.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.answers[state.current] = Number(input.value);
      render();
    });
  });
}

function moveQuestion(step) {
  const next = state.current + step;
  if (next >= 0 && next < state.questions.length) {
    stopAudio();
    state.current = next;
    render();
  }
}

function submitTest() {
  stopAudio();
  state.submitted = true;
  const score = state.questions.reduce((total, question, index) => {
    return total + (state.answers[index] === question.answer ? 1 : 0);
  }, 0);
  const percent = Math.round((score / state.questions.length) * 100);

  appRootEl.hidden = true;
  resultScreenEl.hidden = false;
  resultCorrectCountEl.textContent = score;
  resultTotalCountEl.textContent = state.questions.length;
  resultSummaryEl.innerHTML = `
    <span class="score-ring" style="--score-angle: ${Math.round((score / state.questions.length) * 360)}deg"><strong>${score}</strong><small>点</small></span>
    <span class="result-message">${getResultMessage(percent)}</span>
    <span class="result-detail">${state.questions.length}問中 ${score}問正解（正答率 ${percent}%）</span>
  `;
  resultStatsEl.innerHTML = buildResultStats();
  resultQuestionNavEl.innerHTML = buildQuestionNavButtons();
  resultQuestionNavEl.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      scrollToReview(Number(button.dataset.index));
    });
  });
  reviewListEl.innerHTML = state.questions.map((question, index) => {
    const isCorrect = state.answers[index] === question.answer;
    const userAnswer = state.answers[index] === null ? "未回答" : question.choices[state.answers[index]];
    const script = question.audioText ? `<p>音声スクリプト: ${question.audioText}</p>` : "";
    const sourceText = buildSourceText(question);
    return `
      <div class="review-item ${isCorrect ? "correct" : "wrong"}" id="review-${index}">
        <strong>第${index + 1}問 ${isCorrect ? "正解" : "不正解"}</strong>
        <p class="source-text">問題: ${sourceText}</p>
        <p>あなたの答え: ${userAnswer}</p>
        <p>正解: ${question.choices[question.answer]}</p>
        ${script}
        <p>${question.explanation}</p>
      </div>
    `;
  }).join("");
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function resetTest() {
  prepareNewTest();
  state.started = true;
  render();
}

function playCurrentAudio() {
  const question = state.questions[state.current];
  if (!question.audioText || !("speechSynthesis" in window)) {
    audioStatusEl.textContent = "このブラウザでは音声再生を利用できません。";
    return;
  }

  stopAudio();
  const utterance = new SpeechSynthesisUtterance(question.audioText);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.onstart = () => {
    audioStatusEl.textContent = "再生中...";
  };
  utterance.onend = () => {
    audioStatusEl.textContent = "再生が終わりました。もう一度聞くこともできます。";
  };
  utterance.onerror = () => {
    audioStatusEl.textContent = "音声を再生できませんでした。ブラウザの音量や設定を確認してください。";
  };
  window.speechSynthesis.speak(utterance);
}

function buildSourceText(question) {
  const parts = [];
  if (question.passage) {
    parts.push(question.passage);
  }
  if (question.audioText) {
    parts.push(question.audioText);
  }
  parts.push(question.prompt);
  return parts.join(" / ");
}

function buildQuestionNavButtons() {
  return state.questions.map((_, index) => {
    const resultClass = state.answers[index] === state.questions[index].answer ? "correct" : "wrong";
    const classes = ["nav-dot", resultClass].join(" ");
    return `<button class="${classes}" type="button" data-index="${index}" aria-label="第${index + 1}問の解説へ">${index + 1}</button>`;
  }).join("");
}

function getResultMessage(percent) {
  if (percent >= 80) {
    return "よくできました！";
  }
  if (percent >= 60) {
    return "合格ライン到達です";
  }
  return "もう少し頑張りましょう！";
}

function buildResultStats() {
  const groups = [
    { label: "語彙・文法", sections: ["語彙"], total: 15, pill: "purple" },
    { label: "会話", sections: ["会話"], total: 5, pill: "cyan" },
    { label: "語句整序", sections: ["整序"], total: 5, pill: "amber" },
    { label: "読解", sections: ["読解"], total: 10, pill: "green" },
    { label: "リスニング", sections: ["聴解1", "聴解2", "聴解3"], total: 30, pill: "pink" }
  ];

  return groups.map((group) => {
    const correct = state.questions.reduce((total, question, index) => {
      if (!group.sections.includes(question.section)) {
        return total;
      }
      return total + (state.answers[index] === question.answer ? 1 : 0);
    }, 0);
    const ratio = group.total === 0 ? 0 : Math.round((correct / group.total) * 100);
    return `
      <article class="result-stat-card ${group.pill}">
        <span>${group.label}</span>
        <strong>${correct}/${group.total}</strong>
        <div class="stat-bar" aria-hidden="true">
          <i style="width: ${ratio}%"></i>
        </div>
      </article>
    `;
  }).join("");
}

function scrollToReview(index) {
  const reviewItem = document.getElementById(`review-${index}`);
  if (reviewItem) {
    reviewItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function stopAudio() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function updateTimer() {
  const minutes = String(Math.floor(state.remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(state.remainingSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
}

function renderStartStats() {
  const counts = state.questions.reduce((summary, question) => {
    summary[question.section] = (summary[question.section] || 0) + 1;
    return summary;
  }, {});

  sectionStatsEl.innerHTML = EXAM_BLUEPRINT.map((part) => {
    const count = counts[part.section] || 0;
    return `
      <div class="section-row">
        <span class="pill ${part.pill}">${part.label}</span>
        <strong>${part.detail}</strong>
        <small>${count}問</small>
      </div>
    `;
  }).join("");
}

function shuffle(items) {
  const copied = items.map((item) => ({
    ...item,
    choices: item.choices.map((choice, index) => ({ choice, originalIndex: index }))
  }));

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied.map((item) => {
    const shuffledChoices = item.choices;
    for (let i = shuffledChoices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledChoices[i], shuffledChoices[j]] = [shuffledChoices[j], shuffledChoices[i]];
    }
    return {
      ...item,
      choices: shuffledChoices.map((entry) => entry.choice),
      answer: shuffledChoices.findIndex((entry) => entry.originalIndex === item.answer)
    };
  });
}

setInterval(() => {
  if (!state.started || !state.questions.length || state.submitted || state.remainingSeconds <= 0) {
    return;
  }
  state.remainingSeconds -= 1;
  updateTimer();
  if (state.remainingSeconds === 0) {
    submitTest();
  }
}, 1000);

totalCountEl.textContent = TEST_SIZE;
prepareNewTest();
updateTimer();

// Bộ thẻ mẫu - Tiếng Anh lớp 6 (SGK Kết nối tri thức - đầy đủ 12 unit)
const SAMPLE_SETS = [
  {
    id: 'sample_1', name: 'Unit 1 – My New School',
    colorIndex: 0, issample: true,
    cards: [
      { id:'s1_1', word:'school',       phonetic:'/skuːl/',         meaning:'trường học',        example:'I go to school every day.' },
      { id:'s1_2', word:'classroom',    phonetic:'/ˈklɑːsruːm/',    meaning:'phòng học',         example:'Our classroom is big and bright.' },
      { id:'s1_3', word:'teacher',      phonetic:'/ˈtiːtʃər/',      meaning:'giáo viên',         example:'My teacher is very kind.' },
      { id:'s1_4', word:'student',      phonetic:'/ˈstuːdənt/',     meaning:'học sinh',          example:'She is a good student.' },
      { id:'s1_5', word:'library',      phonetic:'/ˈlaɪbreri/',     meaning:'thư viện',          example:'I read books in the library.' },
      { id:'s1_6', word:'uniform',      phonetic:'/ˈjuːnɪfɔːrm/',  meaning:'đồng phục',         example:'We wear a uniform to school.' },
      { id:'s1_7', word:'subject',      phonetic:'/ˈsʌbdʒɪkt/',    meaning:'môn học',           example:'My favourite subject is Maths.' },
      { id:'s1_8', word:'schedule',     phonetic:'/ˈskedʒuːl/',    meaning:'thời khóa biểu',    example:'I check my schedule every morning.' },
      { id:'s1_9', word:'canteen',      phonetic:'/kænˈtiːn/',      meaning:'căng-tin',          example:'We eat lunch at the canteen.' },
      { id:'s1_10',word:'playground',   phonetic:'/ˈpleɪɡraʊnd/',  meaning:'sân chơi',          example:'Children play on the playground.' },
    ]
  },
  {
    id: 'sample_2', name: 'Unit 2 – My Home',
    colorIndex: 1, issample: true,
    cards: [
      { id:'s2_1', word:'house',        phonetic:'/haʊs/',          meaning:'ngôi nhà',          example:'We live in a small house.' },
      { id:'s2_2', word:'apartment',    phonetic:'/əˈpɑːrtmənt/',   meaning:'căn hộ',            example:'They live in an apartment.' },
      { id:'s2_3', word:'bedroom',      phonetic:'/ˈbedruːm/',      meaning:'phòng ngủ',         example:'My bedroom is on the second floor.' },
      { id:'s2_4', word:'kitchen',      phonetic:'/ˈkɪtʃɪn/',       meaning:'nhà bếp',           example:'My mum cooks in the kitchen.' },
      { id:'s2_5', word:'garden',       phonetic:'/ˈɡɑːrdən/',      meaning:'khu vườn',          example:'We grow flowers in our garden.' },
      { id:'s2_6', word:'furniture',    phonetic:'/ˈfɜːrnɪtʃər/',   meaning:'đồ nội thất',       example:'We bought new furniture last week.' },
      { id:'s2_7', word:'neighbour',    phonetic:'/ˈneɪbər/',        meaning:'hàng xóm',          example:'Our neighbours are very friendly.' },
      { id:'s2_8', word:'balcony',      phonetic:'/ˈbælkəni/',       meaning:'ban công',          example:'I enjoy sitting on the balcony.' },
      { id:'s2_9', word:'living room',  phonetic:'/ˈlɪvɪŋ ruːm/',   meaning:'phòng khách',       example:'We watch TV in the living room.' },
      { id:'s2_10',word:'bathroom',     phonetic:'/ˈbɑːθruːm/',     meaning:'phòng tắm',         example:'The bathroom is next to the bedroom.' },
    ]
  },
  {
    id: 'sample_3', name: 'Unit 3 – My Friends',
    colorIndex: 2, issample: true,
    cards: [
      { id:'s3_1', word:'friendly',     phonetic:'/ˈfrendli/',       meaning:'thân thiện',        example:'She is very friendly to everyone.' },
      { id:'s3_2', word:'funny',        phonetic:'/ˈfʌni/',          meaning:'hài hước',          example:'He is funny and makes us laugh.' },
      { id:'s3_3', word:'clever',       phonetic:'/ˈklevər/',        meaning:'thông minh',        example:'Tom is a clever student.' },
      { id:'s3_4', word:'helpful',      phonetic:'/ˈhelpfəl/',       meaning:'hay giúp đỡ',      example:'My friend is always helpful.' },
      { id:'s3_5', word:'honest',       phonetic:'/ˈɒnɪst/',         meaning:'trung thực',        example:'I want to be honest.' },
      { id:'s3_6', word:'hardworking',  phonetic:'/ˈhɑːrdwɜːrkɪŋ/', meaning:'chăm chỉ',         example:'She is very hardworking.' },
      { id:'s3_7', word:'hobby',        phonetic:'/ˈhɒbi/',          meaning:'sở thích',          example:'My hobby is reading books.' },
      { id:'s3_8', word:'personality',  phonetic:'/ˌpɜːrsəˈnæləti/',meaning:'tính cách',         example:'He has a great personality.' },
      { id:'s3_9', word:'generous',     phonetic:'/ˈdʒenərəs/',      meaning:'rộng lượng',        example:'She is very generous with her time.' },
      { id:'s3_10',word:'confident',    phonetic:'/ˈkɒnfɪdənt/',    meaning:'tự tin',            example:'He is a confident speaker.' },
    ]
  },
  {
    id: 'sample_4', name: 'Unit 4 – My Neighbourhood',
    colorIndex: 3, issample: true,
    cards: [
      { id:'s4_1', word:'supermarket',  phonetic:'/ˈsuːpərmɑːrkɪt/',meaning:'siêu thị',          example:'We shop at the supermarket.' },
      { id:'s4_2', word:'hospital',     phonetic:'/ˈhɒspɪtəl/',     meaning:'bệnh viện',         example:'The hospital is near my house.' },
      { id:'s4_3', word:'park',         phonetic:'/pɑːrk/',          meaning:'công viên',         example:'I play in the park on weekends.' },
      { id:'s4_4', word:'bookshop',     phonetic:'/ˈbʊkʃɒp/',       meaning:'hiệu sách',         example:'I buy books at the bookshop.' },
      { id:'s4_5', word:'post office',  phonetic:'/ˈpoʊst ˌɒfɪs/',  meaning:'bưu điện',          example:'My dad works at the post office.' },
      { id:'s4_6', word:'traffic',      phonetic:'/ˈtræfɪk/',        meaning:'giao thông',        example:'There is heavy traffic in the morning.' },
      { id:'s4_7', word:'crossroads',   phonetic:'/ˈkrɒsroʊdz/',    meaning:'ngã tư',            example:'Turn left at the crossroads.' },
      { id:'s4_8', word:'pavement',     phonetic:'/ˈpeɪvmənt/',      meaning:'vỉa hè',            example:'Walk on the pavement.' },
      { id:'s4_9', word:'pharmacy',     phonetic:'/ˈfɑːrməsi/',      meaning:'hiệu thuốc',        example:'I bought medicine at the pharmacy.' },
      { id:'s4_10',word:'stadium',      phonetic:'/ˈsteɪdiəm/',      meaning:'sân vận động',      example:'We watched football at the stadium.' },
    ]
  },
  {
    id: 'sample_5', name: 'Unit 5 – Natural Wonders',
    colorIndex: 4, issample: true,
    cards: [
      { id:'s5_1', word:'waterfall',    phonetic:'/ˈwɔːtərfɔːl/',   meaning:'thác nước',         example:'Niagara Falls is a famous waterfall.' },
      { id:'s5_2', word:'mountain',     phonetic:'/ˈmaʊntɪn/',      meaning:'núi',               example:'We climbed the mountain last summer.' },
      { id:'s5_3', word:'ocean',        phonetic:'/ˈoʊʃən/',         meaning:'đại dương',         example:'The ocean is deep and blue.' },
      { id:'s5_4', word:'cave',         phonetic:'/keɪv/',           meaning:'hang động',         example:'The cave was dark and cool.' },
      { id:'s5_5', word:'forest',       phonetic:'/ˈfɒrɪst/',        meaning:'rừng',              example:'Many animals live in the forest.' },
      { id:'s5_6', word:'valley',       phonetic:'/ˈvæli/',          meaning:'thung lũng',        example:'The river runs through the valley.' },
      { id:'s5_7', word:'island',       phonetic:'/ˈaɪlənd/',        meaning:'hòn đảo',           example:'We took a boat to the island.' },
      { id:'s5_8', word:'desert',       phonetic:'/ˈdezərt/',        meaning:'sa mạc',            example:'The Sahara is the largest desert.' },
      { id:'s5_9', word:'volcano',      phonetic:'/vɒlˈkeɪnoʊ/',    meaning:'núi lửa',           example:'The volcano erupted last year.' },
      { id:'s5_10',word:'glacier',      phonetic:'/ˈɡleɪʃər/',      meaning:'sông băng',         example:'Glaciers are melting due to climate change.' },
    ]
  },
  {
    id: 'sample_6', name: 'Unit 6 – Our Tet Holiday',
    colorIndex: 0, issample: true,
    cards: [
      { id:'s6_1', word:'celebration',  phonetic:'/ˌseləˈbreɪʃən/', meaning:'lễ kỷ niệm',       example:'The New Year celebration was wonderful.' },
      { id:'s6_2', word:'decoration',   phonetic:'/ˌdekəˈreɪʃən/', meaning:'trang trí',         example:'We put up decorations for Tet.' },
      { id:'s6_3', word:'tradition',    phonetic:'/trəˈdɪʃən/',     meaning:'truyền thống',      example:'This is an old Vietnamese tradition.' },
      { id:'s6_4', word:'fireworks',    phonetic:'/ˈfaɪərwɜːrks/',  meaning:'pháo hoa',          example:'We watched fireworks on New Year\'s Eve.' },
      { id:'s6_5', word:'lucky money',  phonetic:'/ˈlʌki ˈmʌni/',   meaning:'tiền mừng tuổi',   example:'Children receive lucky money at Tet.' },
      { id:'s6_6', word:'ancestor',     phonetic:'/ˈænsestər/',     meaning:'tổ tiên',           example:'We honour our ancestors at Tet.' },
      { id:'s6_7', word:'peach blossom',phonetic:'/piːtʃ ˈblɒsəm/', meaning:'hoa đào',           example:'Peach blossoms bloom during Tet.' },
      { id:'s6_8', word:'reunion',      phonetic:'/riːˈjuːniən/',   meaning:'đoàn tụ',           example:'Tet is a time for family reunion.' },
      { id:'s6_9', word:'offering',     phonetic:'/ˈɒfərɪŋ/',       meaning:'vật cúng',          example:'We prepare offerings for the altar.' },
      { id:'s6_10',word:'spring',       phonetic:'/sprɪŋ/',          meaning:'mùa xuân',          example:'Tet marks the beginning of spring.' },
    ]
  },
  {
    id: 'sample_7', name: 'Unit 7 – Television',
    colorIndex: 1, issample: true,
    cards: [
      { id:'s7_1', word:'channel',      phonetic:'/ˈtʃænəl/',       meaning:'kênh truyền hình',  example:'What channel is the football on?' },
      { id:'s7_2', word:'documentary',  phonetic:'/ˌdɒkjuˈmentri/', meaning:'phim tài liệu',     example:'I watched a documentary about nature.' },
      { id:'s7_3', word:'cartoon',      phonetic:'/kɑːrˈtuːn/',     meaning:'phim hoạt hình',    example:'My sister loves watching cartoons.' },
      { id:'s7_4', word:'remote control',phonetic:'/rɪˈmoʊt kənˈtroʊl/',meaning:'điều khiển từ xa',example:'Hand me the remote control, please.' },
      { id:'s7_5', word:'programme',    phonetic:'/ˈproʊɡræm/',     meaning:'chương trình',      example:'My favourite programme is on at 7 PM.' },
      { id:'s7_6', word:'comedy',       phonetic:'/ˈkɒmədi/',        meaning:'phim hài',          example:'We laughed a lot at the comedy.' },
      { id:'s7_7', word:'series',       phonetic:'/ˈsɪəriːz/',       meaning:'phim bộ',           example:'I\'m watching a new TV series.' },
      { id:'s7_8', word:'broadcast',    phonetic:'/ˈbrɔːdkɑːst/',   meaning:'phát sóng',         example:'The match will be broadcast live.' },
      { id:'s7_9', word:'weather forecast',phonetic:'/ˈweðər ˈfɔːrkɑːst/',meaning:'dự báo thời tiết',example:'I watch the weather forecast every morning.' },
      { id:'s7_10',word:'advertisement',phonetic:'/ədˈvɜːrtɪsmənt/',meaning:'quảng cáo',         example:'There are too many advertisements on TV.' },
    ]
  },
  {
    id: 'sample_8', name: 'Unit 8 – Sports and Games',
    colorIndex: 2, issample: true,
    cards: [
      { id:'s8_1', word:'athletics',    phonetic:'/æθˈletɪks/',     meaning:'điền kinh',         example:'She competes in athletics.' },
      { id:'s8_2', word:'gymnastics',   phonetic:'/dʒɪmˈnæstɪks/', meaning:'thể dục dụng cụ',  example:'Gymnastics requires flexibility.' },
      { id:'s8_3', word:'swimming',     phonetic:'/ˈswɪmɪŋ/',       meaning:'bơi lội',           example:'Swimming is good for your health.' },
      { id:'s8_4', word:'champion',     phonetic:'/ˈtʃæmpiən/',     meaning:'nhà vô địch',       example:'He is the world chess champion.' },
      { id:'s8_5', word:'tournament',   phonetic:'/ˈtʊrnəmənt/',    meaning:'giải đấu',          example:'Our team won the tournament.' },
      { id:'s8_6', word:'referee',      phonetic:'/ˌrefəˈriː/',      meaning:'trọng tài',         example:'The referee blew his whistle.' },
      { id:'s8_7', word:'trophy',       phonetic:'/ˈtroʊfi/',        meaning:'cúp/giải thưởng',   example:'They held up the trophy proudly.' },
      { id:'s8_8', word:'penalty',      phonetic:'/ˈpenəlti/',       meaning:'phạt đền',          example:'The player scored from the penalty spot.' },
      { id:'s8_9', word:'spectator',    phonetic:'/spekˈteɪtər/',    meaning:'khán giả',          example:'Spectators cheered loudly.' },
      { id:'s8_10',word:'victory',      phonetic:'/ˈvɪktəri/',       meaning:'chiến thắng',       example:'The team celebrated their victory.' },
    ]
  },
  {
    id: 'sample_9', name: 'Unit 9 – Cities of the World',
    colorIndex: 3, issample: true,
    cards: [
      { id:'s9_1', word:'capital',      phonetic:'/ˈkæpɪtəl/',      meaning:'thủ đô',            example:'Hanoi is the capital of Vietnam.' },
      { id:'s9_2', word:'population',   phonetic:'/ˌpɒpjuˈleɪʃən/',meaning:'dân số',            example:'The city has a large population.' },
      { id:'s9_3', word:'skyscraper',   phonetic:'/ˈskaɪskreɪpər/',meaning:'nhà chọc trời',     example:'New York has many skyscrapers.' },
      { id:'s9_4', word:'monument',     phonetic:'/ˈmɒnjumənt/',    meaning:'tượng đài',         example:'They built a monument in the square.' },
      { id:'s9_5', word:'attraction',   phonetic:'/əˈtrækʃən/',     meaning:'điểm tham quan',    example:'The Eiffel Tower is a famous attraction.' },
      { id:'s9_6', word:'subway',       phonetic:'/ˈsʌbweɪ/',        meaning:'tàu điện ngầm',     example:'We took the subway to the museum.' },
      { id:'s9_7', word:'harbour',      phonetic:'/ˈhɑːrbər/',       meaning:'cảng biển',         example:'Sydney Harbour is beautiful at sunset.' },
      { id:'s9_8', word:'culture',      phonetic:'/ˈkʌltʃər/',       meaning:'văn hóa',           example:'Each city has its own culture.' },
      { id:'s9_9', word:'architecture', phonetic:'/ˈɑːrkɪtektʃər/', meaning:'kiến trúc',         example:'Paris is known for its architecture.' },
      { id:'s9_10',word:'cosmopolitan', phonetic:'/ˌkɒzməˈpɒlɪtən/',meaning:'đa văn hóa',       example:'London is a cosmopolitan city.' },
    ]
  },
  {
    id: 'sample_10', name: 'Unit 10 – Our Houses in the Future',
    colorIndex: 4, issample: true,
    cards: [
      { id:'s10_1',word:'solar panel',  phonetic:'/ˈsoʊlər ˈpænəl/',meaning:'tấm pin mặt trời', example:'Solar panels produce clean energy.' },
      { id:'s10_2',word:'robot',        phonetic:'/ˈroʊbɒt/',        meaning:'rô-bốt',           example:'A robot will clean the house.' },
      { id:'s10_3',word:'smart home',   phonetic:'/smɑːrt hoʊm/',    meaning:'nhà thông minh',   example:'A smart home can control itself.' },
      { id:'s10_4',word:'recycle',      phonetic:'/riːˈsaɪkəl/',     meaning:'tái chế',          example:'We should recycle paper and plastic.' },
      { id:'s10_5',word:'environment',  phonetic:'/ɪnˈvaɪrənmənt/', meaning:'môi trường',        example:'We must protect the environment.' },
      { id:'s10_6',word:'electricity',  phonetic:'/ɪˌlekˈtrɪsəti/', meaning:'điện',              example:'Solar energy produces electricity.' },
      { id:'s10_7',word:'technology',   phonetic:'/tekˈnɒlədʒi/',   meaning:'công nghệ',         example:'New technology makes life easier.' },
      { id:'s10_8',word:'underground',  phonetic:'/ˈʌndərɡraʊnd/', meaning:'dưới lòng đất',     example:'Some houses may be built underground.' },
      { id:'s10_9',word:'floating',     phonetic:'/ˈfloʊtɪŋ/',      meaning:'nổi trên mặt nước',example:'Floating houses are common in some areas.' },
      { id:'s10_10',word:'sustainable', phonetic:'/səˈsteɪnəbəl/',  meaning:'bền vững',          example:'We need sustainable energy sources.' },
    ]
  },
  {
    id: 'sample_11', name: 'Unit 11 – Our Greener World',
    colorIndex: 0, issample: true,
    cards: [
      { id:'s11_1',word:'pollution',    phonetic:'/pəˈluːʃən/',     meaning:'ô nhiễm',           example:'Air pollution is a big problem.' },
      { id:'s11_2',word:'greenhouse',   phonetic:'/ˈɡriːnhaʊs/',   meaning:'nhà kính',          example:'Greenhouse gases cause global warming.' },
      { id:'s11_3',word:'deforestation',phonetic:'/diːˌfɒrɪˈsteɪʃən/',meaning:'phá rừng',      example:'Deforestation destroys animal habitats.' },
      { id:'s11_4',word:'endangered',   phonetic:'/ɪnˈdeɪndʒərd/', meaning:'có nguy cơ tuyệt chủng',example:'Tigers are an endangered species.' },
      { id:'s11_5',word:'renewable',    phonetic:'/rɪˈnjuːəbəl/',   meaning:'có thể tái tạo',    example:'Wind is a renewable energy source.' },
      { id:'s11_6',word:'carbon',       phonetic:'/ˈkɑːrbən/',      meaning:'các-bon',           example:'We must reduce carbon emissions.' },
      { id:'s11_7',word:'organic',      phonetic:'/ɔːrˈɡænɪk/',    meaning:'hữu cơ',            example:'Organic food is better for you.' },
      { id:'s11_8',word:'biodiversity', phonetic:'/ˌbaɪoʊdaɪˈvɜːrsəti/',meaning:'đa dạng sinh học',example:'Biodiversity keeps nature balanced.' },
      { id:'s11_9',word:'conservation', phonetic:'/ˌkɒnsəˈveɪʃən/',meaning:'bảo tồn',           example:'Conservation of wildlife is important.' },
      { id:'s11_10',word:'eco-friendly',phonetic:'/ˌiːkoʊ ˈfrendli/',meaning:'thân thiện môi trường',example:'Use eco-friendly bags instead of plastic.' },
    ]
  },
  {
    id: 'sample_12', name: 'Unit 12 – Robots',
    colorIndex: 1, issample: true,
    cards: [
      { id:'s12_1',word:'artificial intelligence',phonetic:'/ˌɑːrtɪˈfɪʃəl ɪnˈtelɪdʒəns/',meaning:'trí tuệ nhân tạo',example:'AI can solve complex problems.' },
      { id:'s12_2',word:'sensor',       phonetic:'/ˈsensər/',       meaning:'cảm biến',          example:'Robots use sensors to detect objects.' },
      { id:'s12_3',word:'programme',    phonetic:'/ˈproʊɡræm/',    meaning:'lập trình',         example:'Engineers programme the robot.' },
      { id:'s12_4',word:'automatic',    phonetic:'/ˌɔːtəˈmætɪk/', meaning:'tự động',           example:'The door is automatic.' },
      { id:'s12_5',word:'surgery',      phonetic:'/ˈsɜːrdʒəri/',   meaning:'phẫu thuật',        example:'Robots can assist in surgery.' },
      { id:'s12_6',word:'warehouse',    phonetic:'/ˈweərhaʊs/',    meaning:'nhà kho',           example:'Robots move boxes in the warehouse.' },
      { id:'s12_7',word:'manufacture',  phonetic:'/ˌmænjuˈfæktʃər/',meaning:'sản xuất',        example:'Robots help manufacture cars.' },
      { id:'s12_8',word:'explore',      phonetic:'/ɪkˈsplɔːr/',    meaning:'khám phá',          example:'Robots explore the surface of Mars.' },
      { id:'s12_9',word:'interact',     phonetic:'/ˌɪntərˈækt/',   meaning:'tương tác',         example:'Some robots interact with humans.' },
      { id:'s12_10',word:'precision',   phonetic:'/prɪˈsɪʒən/',    meaning:'độ chính xác',      example:'Robots work with great precision.' },
    ]
  },
];

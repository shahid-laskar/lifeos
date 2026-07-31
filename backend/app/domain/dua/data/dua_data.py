from __future__ import annotations

from app.domain.dua.entities import DuaItem

DUAS = [
    DuaItem(
        id="morning-1",
        category="Morning",
        arabic_text="اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
        transliteration="Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namoot, wa ilaykan-nushoor.",
        translation="O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the Final Return.",
        reference="Abu Dawud 4/317, At-Tirmidhi 3/142",
        when_to_recite="In the morning"
    ),
    DuaItem(
        id="evening-1",
        category="Evening",
        arabic_text="اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
        transliteration="Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namoot, wa ilaykal-maseer.",
        translation="O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.",
        reference="Abu Dawud 4/317",
        when_to_recite="In the evening"
    ),
    DuaItem(
        id="travel-1",
        category="Travel",
        arabic_text="سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
        transliteration="Subhanal-lathee sakhkhara lana hatha wa ma kunna lahu muqrineen. Wa inna ila Rabbina lamunqaliboon.",
        translation="Glory is to Him Who has provided this for us though we could never have had it by our efforts. Surely, unto our Lord we are returning.",
        reference="Qur'an 43:13-14",
        when_to_recite="When riding a vehicle or starting a journey"
    ),
    DuaItem(
        id="sleep-1",
        category="Sleep",
        arabic_text="بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration="Bismikal-lahumma amootu wa-ahya.",
        translation="In Your name O Allah, I live and die.",
        reference="Al-Bukhari 11/113, Muslim 4/2083",
        when_to_recite="Before going to sleep"
    ),
    DuaItem(
        id="food-1",
        category="Food",
        arabic_text="بِسْمِ اللَّهِ",
        transliteration="Bismillah.",
        translation="In the name of Allah.",
        reference="Abu Dawud 3/347",
        when_to_recite="Before eating"
    ),
    DuaItem(
        id="protection-1",
        category="Protection",
        arabic_text="بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        transliteration="Bismillahil-ladhi la yadurru ma'as-mihi shai'un fil-ardi wa la fis-sama'i, wa Huwas-Sami'ul-'Alim.",
        translation="In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
        reference="Abu Dawud 4/323",
        when_to_recite="Three times in the morning and evening"
    )
]

def get_dua_catalogue() -> list[DuaItem]:
    return DUAS

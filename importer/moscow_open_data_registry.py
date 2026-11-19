"""Official Moscow court open-data registry, from user-supplied meta.json.
The 40 IDs belong to the portal; this code never treats their mere presence as
permission to download, republish personal data or infer legal reasoning.
"""
from dataclasses import dataclass

@dataclass(frozen=True)
class Dataset:
    identifier: str
    role: str
    title: str

    @property
    def passport(self):
        return "https://data.mos-gorsud.ru/api/opendata/" + self.identifier + "/passport/json"

    @property
    def download_url(self):
        # Historical endpoint pattern; live availability is NOT yet confirmed.
        return "https://data.mos-gorsud.ru/api/opendata/" + self.identifier + "/latest/data/json/"

    @property
    def portal_url(self):
        return "https://data.mos-gorsud.ru/opendata/" + self.identifier

CATALOG = tuple(Dataset(*s.split("|", 2)) for s in """1571992852413-casesinfodemographiccriminalddzqk|excluded|Демография: уголовные дела, 2018
1571992873315-casesinfototaldemographiccriminalatzpo|excluded|Демография: уголовные дела, 2015–2018
1577116794369-casesgroupfirstadminhgzol|first|Административные дела первой инстанции
1577116594824-casesgroupfirstcivilhxvgb|first|Гражданские дела первой инстанции
1577116849252-casesgrouprsadminihtpb|first|Административные правонарушения первой инстанции
1577116978408-casesgroupfirstadminexecxlifd|first|Административные дела: исполнение постановлений
1577116924599-casesgroupfirstcivilexecwueus|first|Гражданские дела: исполнение постановлений
1577116537934-casesgroupclaimadminpcleu|context|Административное производство: первичные документы
1577116455933-casesgroupclaimcivillefmu|context|Гражданское производство: первичные документы
1577116724824-casesgroupfirstcriminalluivn|first|Уголовные дела первой инстанции
1577117189318-contactsandhoursgfjvi|context|Контакты и часы приема судов
1577117780217-casesgroupmgsappealadminpmjqo|appeal|МГС: административная апелляция
1577117723940-casesgroupmgsappealcoladminkfcqb|appeal|МГС: административная апелляционная коллегия
1577117744056-casesgroupmgsappealcivilwtxga|appeal|МГС: гражданская апелляция
1577117680328-casesgroupmgsappealcolcivilagblr|appeal|МГС: гражданская апелляционная коллегия
1577117356143-casesgroupmgsfirstcriminalexecljwfh|first|МГС: исполнение постановлений по уголовным делам
1577117435942-casesgroupmgsreviewnotyetrcpnx|appeal|МГС: пересмотр постановлений по КоАП
1577117758402-casesgroupmgsappealcriminalquiik|appeal|МГС: уголовная апелляция
1577117711793-casesgroupmgsappealcolcriminalojqgu|appeal|МГС: уголовная апелляционная коллегия
1577103912804-casesallwcdeh|index|Перечень всех дел
1577103985220-casesadminjnamf|index|Перечень административных дел
1577104020864-casescivilydenl|index|Перечень гражданских дел
1577188664899-casesreviewvjtjl|index|Перечень дел по КоАП
1577104041783-casescriminalshuyq|index|Перечень уголовных дел
1577117657461-casesgrouprsappealadminkasuzjrw|appeal|Районные суды: административные апелляции
1577117540836-casesgrouprsappealcivilxpydy|appeal|Районные суды: гражданские апелляции
1577117668836-casesgrouprsappealreviewoxycm|appeal|Районные суды: апелляции по КоАП
1577117031546-casesgrouprscriminalmaterialsdqtwg|first|Районные суды: материалы уголовного судопроизводства
1577117487205-casesgrouprsclaimcriminalvgcpa|context|Районные суды: первичные документы уголовного производства
1577117641473-casesgrouprsappealcriminalspeee|appeal|Районные суды: уголовные апелляции
1577111367451-courtsessionsscheduledkaay|context|Расписание судебных заседаний
1577111228028-dutyateav|context|Реквизиты для госпошлины
1577175266593-casesinfotranslationscdmxx|context|Доступные видеозаписи заседаний
1577175311767-casesinfojudicialactsxfwwh|context|Статистика судебных актов, 2018
1592252385755-anticorruptionjdhmg|excluded|Доходы сотрудников районных судов за 2018
1577175992239-anticorruptionemployeemgsgrcnu|excluded|Доходы сотрудников МГС за 2018
1577175974458-anticorruptionmgscdsia|excluded|Доходы руководства МГС за 2018
1571992928844-casesinfoamountrecoveredqgqyr|context|Статистика взысканий, 2018
1585927172829-nonproceduralappealdddqw|excluded|Внепроцессуальные обращения, 2018
1577117143727-nonproceduralappealltisb|excluded|Внепроцессуальные обращения, 2019""".splitlines())
BY_ID = {row.identifier: row for row in CATALOG}
assert len(CATALOG) == len(BY_ID) == 40
assert set(x.role for x in CATALOG) == {"first", "appeal", "index", "context", "excluded"}

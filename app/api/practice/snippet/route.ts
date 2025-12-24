import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Difficulty, LanguageName, Prisma } from "@prisma/client";

type SnippetResponse = {
  id: string | null;
  content: string;
  languageName: LanguageName;
  difficulty: Difficulty;
  topicName: string | null;
  isSample: boolean;
};

const SAMPLE_SNIPPETS: Record<
  LanguageName,
  { topic: string; content: string }[]
> = {
  C: [
    { topic: "basics", content: '#include <stdio.h>\n\nint main() {\n    printf("Hello, CodeXly!\\n");\n    return 0;\n}\n' },
    { topic: "recursion", content: '#include <stdio.h>\n\nint fib(int n) { return n <= 1 ? n : fib(n-1)+fib(n-2); }\nint main() {\n    printf("%d\\n", fib(6));\n    return 0;\n}\n' },
    { topic: "loops", content: '#include <stdio.h>\n\nint main() {\n    int nums[] = {1, 2, 3, 4};\n    int sum = 0;\n    for (int i = 0; i < 4; i++) sum += nums[i];\n    printf("%d\\n", sum);\n    return 0;\n}\n' },
    { topic: "pointers", content: '#include <stdio.h>\n\nvoid swap(int *a, int *b) {\n    int tmp = *a;\n    *a = *b;\n    *b = tmp;\n}\n\nint main() {\n    int x = 3, y = 7;\n    swap(&x, &y);\n    printf("%d %d\\n\", x, y);\n    return 0;\n}\n' },
  ],
  CPP: [
    { topic: "stl", content: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    vector<int> nums{1,2,3,4};\n    long long sum = accumulate(nums.begin(), nums.end(), 0LL);\n    cout << sum << "\\n";\n}\n' },
    { topic: "strings", content: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    string s = "racecar";\n    string r = s;\n    reverse(r.begin(), r.end());\n    cout << boolalpha << (s == r) << "\\n";\n}\n' },
    { topic: "maps", content: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    map<string,int> freq;\n    vector<string> words{\"code\", \"xly\", \"code\"};\n    for (auto &w : words) freq[w]++;\n    cout << freq[\"code\"] << \"\\n\";\n}\n' },
    { topic: "algorithms", content: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    vector<int> nums{5, 1, 4, 2, 3};\n    sort(nums.begin(), nums.end());\n    for (int n : nums) cout << n << \" \";\n    cout << \"\\n\";\n}\n' },
  ],
  JAVA: [
    { topic: "loops", content: "class Main {\n    public static void main(String[] args) {\n        int[] arr = {1, 2, 3};\n        int sum = 0;\n        for (int n : arr) sum += n;\n        System.out.println(sum);\n    }\n}\n" },
    { topic: "streams", content: "import java.util.*;\nclass Main {\n  public static void main(String[] args) {\n    List<String> names = Arrays.asList(\"ana\", \"bob\", \"carl\");\n    names.stream().sorted().forEach(System.out::println);\n  }\n}\n" },
    { topic: "collections", content: "import java.util.*;\nclass Main {\n  public static void main(String[] args) {\n    Map<String, Integer> scores = new HashMap<>();\n    scores.put(\"alice\", 10);\n    scores.put(\"bob\", 7);\n    System.out.println(scores.getOrDefault(\"alice\", 0));\n  }\n}\n" },
    { topic: "optional", content: "import java.util.Optional;\nclass Main {\n  public static void main(String[] args) {\n    Optional<String> maybe = Optional.of(\"CodeXly\");\n    System.out.println(maybe.map(String::toUpperCase).orElse(\"EMPTY\"));\n  }\n}\n" },
  ],
  JAVASCRIPT: [
    { topic: "array-reduce", content: "const nums = [1, 2, 3, 4];\nconst sum = nums.reduce((acc, n) => acc + n, 0);\nconsole.log(sum);\n" },
    { topic: "memoization", content: "function memoize(fn) {\n  const cache = new Map();\n  return (x) => cache.has(x) ? cache.get(x) : (cache.set(x, fn(x)), cache.get(x));\n}\nconst fib = memoize(n => n < 2 ? n : fib(n-1) + fib(n-2));\nconsole.log(fib(10));\n" },
    { topic: "async-await", content: "async function fetchUser(id) {\n  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);\n  const user = await res.json();\n  console.log(user.name);\n}\n\nfetchUser(1);\n" },
    { topic: "array-methods", content: "const words = [\"code\", \"xly\", \"practice\"];\nconst upper = words.map(w => w.toUpperCase()).join(\" - \");\nconsole.log(upper);\n" },
  ],
  TYPESCRIPT: [
    { topic: "types", content: 'type User = { id: string; name: string };\nconst format = (user: User) => `Hello ${user.name}`;\nconsole.log(format({ id: "1", name: "Dev" }));\n' },
    { topic: "math", content: "type Point = { x: number; y: number };\nconst dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);\nconsole.log(dist({ x: 0, y: 0 }, { x: 3, y: 4 }));\n" },
  ],
  PYTHON: [
    { topic: "hashmap", content: "def two_sum(nums, target):\n    lookup = {}\n    for i, n in enumerate(nums):\n        if target - n in lookup:\n            return [lookup[target - n], i]\n        lookup[n] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))\n" },
    { topic: "collections", content: "from collections import Counter\n\ns = \"banana\"\nc = Counter(s)\nprint(c.most_common(1)[0])\n" },
  ],
  RUST: [
    { topic: "iterators", content: 'fn main() {\n    let nums = vec![1, 2, 3, 4];\n    let sum: i32 = nums.iter().sum();\n    println!("{}", sum);\n}\n' },
    { topic: "strings", content: "fn is_palindrome(s: &str) -> bool {\n    let r: String = s.chars().rev().collect();\n    s == r\n}\n\nfn main() {\n    println!(\"{}\", is_palindrome(\"racecar\"));\n}\n" },
  ],
  GO: [
    { topic: "loops", content: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    nums := []int{1, 2, 3}\n    sum := 0\n    for _, n := range nums {\n        sum += n\n    }\n    fmt.Println(sum)\n}\n" },
    { topic: "strings", content: "package main\n\nimport \"fmt\"\n\nfunc isPalindrome(s string) bool {\n    r := []rune(s)\n    for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {\n        if r[i] != r[j] {\n            return false\n        }\n    }\n    return true\n}\n\nfunc main() {\n    fmt.Println(isPalindrome(\"racecar\"))\n}\n" },
  ],
};

const isLanguage = (value: string | null): value is LanguageName =>
  Boolean(value && (Object.values(LanguageName) as string[]).includes(value));

const isDifficulty = (value: string | null): value is Difficulty =>
  Boolean(value && (Object.values(Difficulty) as string[]).includes(value));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const languageParam = searchParams.get("language")?.toUpperCase() ?? null;
  const difficultyParam = searchParams.get("difficulty")?.toUpperCase() ?? null;
  const topicParam = searchParams.get("topic");
  const excludeParam = searchParams.get("exclude"); // comma-separated snippet ids to avoid in this request

  // Gracefully fall back to a default language instead of hard failing.
  const effectiveLanguage: LanguageName = isLanguage(languageParam)
    ? languageParam
    : LanguageName.JAVASCRIPT;

  const difficulty: Difficulty = isDifficulty(difficultyParam)
    ? (difficultyParam as Difficulty)
    : Difficulty.BEGINNER;

  try {
    // Ensure the language row exists so future inserts succeed.
    const languageRow = await prisma.language.upsert({
      where: { name: effectiveLanguage },
      update: {},
      create: { name: effectiveLanguage },
    });

    const excludeIds =
      excludeParam
        ?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) ?? [];

    const where: Prisma.SnippetWhereInput = {
      languageId: languageRow.id,
      difficulty,
      ...(topicParam && topicParam !== "any"
        ? {
            topic: {
              name: {
                equals: topicParam,
                mode: "insensitive",
              },
            },
          }
        : {}),
      ...(excludeIds.length > 0
        ? {
            id: {
              notIn: excludeIds,
            },
          }
        : {}),
    };

    const total = await prisma.snippet.count({
      where,
    });

    if (total > 0) {
      const skip = Math.floor(Math.random() * total);
      const snippet = await prisma.snippet.findFirst({
        where,
        skip,
        orderBy: { createdAt: "desc" },
        include: { 
          language: {
            select: { name: true }
          }, 
          topic: {
            select: { name: true }
          }
        },
      });

      if (snippet) {
        const payload: SnippetResponse = {
          id: snippet.id,
          content: snippet.content,
          languageName: snippet.language.name,
          difficulty: snippet.difficulty,
          topicName: snippet.topic?.name ?? null,
          isSample: false,
        };
        return NextResponse.json(payload);
      }
    }

    // Fallback to an in-memory sample snippet so the UI is still usable.
    const samples = SAMPLE_SNIPPETS[effectiveLanguage] ?? [];
    const filteredSamples = topicParam
      ? samples.filter((s) => s.topic.toLowerCase() === topicParam.toLowerCase())
      : samples;
    const pickFrom = filteredSamples.length > 0 ? filteredSamples : samples;
    const sample =
      pickFrom.length > 0 ? pickFrom[Math.floor(Math.random() * pickFrom.length)] : null;
    if (sample) {
      const fallback: SnippetResponse = {
        id: null,
        content: sample.content,
        languageName: effectiveLanguage,
        difficulty,
        topicName: sample.topic,
        isSample: true,
      };
      return NextResponse.json(fallback);
    }

    return NextResponse.json(
      { error: "No snippet available for the selected language." },
      { status: 404 },
    );
  } catch (error) {
    console.error("GET /api/practice/snippet failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}


/**
 * Peaklyy Forge - Problem Data Layer (P1 Online Judge)
 *
 * Contains 6 LeetCode-standard practice problems with:
 * - Clean student-facing starter code (classes & function signatures ONLY)
 * - Server-side driver harnesses for automated test-case evaluation
 * - Sample test cases (public) and hidden test cases (server evaluation)
 */

const PROBLEMS_DATA = [
  {
    id: "two-sum",
    problemNumber: 1,
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    topics: ["Arrays", "Hash Table"],
    solvesCount: "12.5K",
    acceptanceRate: "68%",
    isSolved: true,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    inputFormat: "Line 1: JSON array or space/comma-separated list of integers `nums`\nLine 2: Integer `target`",
    outputFormat: "JSON array containing the two indices `[i, j]`",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    examples: [
      {
        num: 1,
        input: "[2, 7, 11, 15]\n9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        num: 2,
        input: "[3, 2, 4]\n6",
        output: "[1, 2]",
      },
    ],
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums, target):
        # Write your solution here
        lookup = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in lookup:
                return [lookup[diff], i]
            lookup[num] = i
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here
  return [];
}
`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}
`,
    },
    drivers: {
      python: `import sys, json

{{USER_CODE}}

if __name__ == '__main__':
    lines = [line.strip() for line in sys.stdin if line.strip()]
    if len(lines) >= 2:
        raw_nums = lines[0]
        nums = json.loads(raw_nums) if raw_nums.startswith('[') else [int(x) for x in raw_nums.replace(',', ' ').split()]
        target = int(lines[1])
        try:
            solution = Solution()
            result = solution.twoSum(nums, target)
        except NameError:
            result = twoSum(nums, target)
        print(json.dumps(result if result is not None else []))
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n').filter(Boolean);
if (input.length >= 2) {
  const nums = JSON.parse(input[0].startsWith('[') ? input[0] : JSON.stringify(input[0].split(/[\\s,]+/).map(Number)));
  const target = Number(input[1]);
  const fn = typeof twoSum === 'function' ? twoSum : (typeof Solution === 'function' ? (new Solution()).twoSum : null);
  console.log(JSON.stringify((fn ? fn(nums, target) : []) || []));
}
`,
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String line1 = scanner.nextLine().trim();
        if (!scanner.hasNextInt()) return;
        int target = scanner.nextInt();

        line1 = line1.replace("[", "").replace("]", "").replace(",", " ").trim();
        String[] parts = line1.split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i]);
        }

        Solution sol = new Solution();
        int[] res = sol.twoSum(nums, target);
        if (res == null || res.length < 2) {
            System.out.println("[]");
        } else {
            System.out.println("[" + res[0] + "," + res[1] + "]");
        }
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "json",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "[2,7,11,15]\n9", expected: "[0,1]", weight: 35 },
      { id: 2, title: "Test Case 2", input: "[3,2,4]\n6", expected: "[1,2]", weight: 35 },
      { id: 3, title: "Test Case 3", input: "[3,3]\n6", expected: "[0,1]", weight: 30 },
    ],
    hiddenTestCases: [
      { id: 101, input: "[1,5,8,12,19,25]\n27", expected: "[2,4]", weight: 50 },
      { id: 102, input: "[-3,4,3,90]\n0", expected: "[0,2]", weight: 50 },
    ],
  },
  {
    id: "add-two-numbers",
    problemNumber: 2,
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Medium",
    topics: ["Linked List", "Math", "Recursion"],
    description: `You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.

You may assume the two numbers do not contain any leading zero, except the number 0 itself.`,
    inputFormat: "Line 1: JSON array representing first list in reverse order (e.g. `[2,4,3]`)\nLine 2: JSON array representing second list in reverse order (e.g. `[5,6,4]`)",
    outputFormat: "JSON array of digits representing the sum linked list in reverse order",
    constraints: [
      "The number of nodes in each linked list is in the range [1, 100].",
      "0 <= Node.val <= 9",
      "It is guaranteed that the list represents a number that does not have leading zeros.",
    ],
    examples: [
      {
        num: 1,
        input: "[2,4,3]\n[5,6,4]",
        output: "[7,0,8]",
        explanation: "342 + 465 = 807.",
      },
      {
        num: 2,
        input: "[0]\n[0]",
        output: "[0]",
        explanation: "0 + 0 = 0.",
      },
    ],
    starterCode: {
      python: `class Solution:
    def addTwoNumbers(self, l1, l2):
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} l1
 * @param {number[]} l2
 * @return {number[]}
 */
function addTwoNumbers(l1, l2) {
  // Write your solution here
  return [];
}
`,
      java: `class Solution {
    public List<Integer> addTwoNumbers(List<Integer> l1, List<Integer> l2) {
        // Write your solution here
        return new ArrayList<>();
    }
}
`,
    },
    drivers: {
      python: `import sys, json

{{USER_CODE}}

if __name__ == '__main__':
    lines = [l.strip() for l in sys.stdin if l.strip()]
    if len(lines) >= 2:
        l1 = json.loads(lines[0]) if lines[0].startswith('[') else [int(x) for x in lines[0].replace(',', ' ').split()]
        l2 = json.loads(lines[1]) if lines[1].startswith('[') else [int(x) for x in lines[1].replace(',', ' ').split()]
        try:
            solution = Solution()
            result = solution.addTwoNumbers(l1, l2)
        except NameError:
            result = addTwoNumbers(l1, l2)
        print(json.dumps(result or []))
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n').filter(Boolean);
if (input.length >= 2) {
  const l1 = JSON.parse(input[0]);
  const l2 = JSON.parse(input[1]);
  const fn = typeof addTwoNumbers === 'function' ? addTwoNumbers : (typeof Solution === 'function' ? (new Solution()).addTwoNumbers : null);
  console.log(JSON.stringify((fn ? fn(l1, l2) : []) || []));
}
`,
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String s1 = sc.nextLine().replaceAll("[\\[\\]\\\\s]", "");
        if (!sc.hasNextLine()) return;
        String s2 = sc.nextLine().replaceAll("[\\[\\]\\\\s]", "");

        List<Integer> l1 = parse(s1);
        List<Integer> l2 = parse(s2);
        Solution sol = new Solution();
        List<Integer> res = sol.addTwoNumbers(l1, l2);
        System.out.println(res == null ? "[]" : res.toString().replace(" ", ""));
    }
    static List<Integer> parse(String s) {
        List<Integer> list = new ArrayList<>();
        if (s.isEmpty()) return list;
        for (String p : s.split(",")) if (!p.isEmpty()) list.add(Integer.parseInt(p.trim()));
        return list;
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "json",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "[2,4,3]\n[5,6,4]", expected: "[7,0,8]", weight: 50 },
      { id: 2, title: "Test Case 2", input: "[0]\n[0]", expected: "[0]", weight: 50 },
    ],
    hiddenTestCases: [
      { id: 101, input: "[1]\n[9,9]", expected: "[0,0,1]", weight: 50 },
    ],
  },
  {
    id: "longest-substring-without-repeating-characters",
    problemNumber: 3,
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    topics: ["Hash Table", "Strings", "Sliding Window"],
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.`,
    inputFormat: "Line 1: String `s`",
    outputFormat: "Integer length of longest substring without repeating characters",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    examples: [
      { num: 1, input: "abcabcbb", output: "3", explanation: "The answer is 'abc', with the length of 3." },
      { num: 2, input: "bbbbb", output: "1", explanation: "The answer is 'b', with the length of 1." },
    ],
    starterCode: {
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Write your solution here
  return 0;
}
`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your solution here
        return 0;
    }
}
`,
    },
    drivers: {
      python: `import sys

{{USER_CODE}}

if __name__ == '__main__':
    raw = sys.stdin.read().rstrip('\\r\\n')
    try:
        solution = Solution()
        result = solution.lengthOfLongestSubstring(raw)
    except NameError:
        result = lengthOfLongestSubstring(raw)
    print(result if result is not None else 0)
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');
const fn = typeof lengthOfLongestSubstring === 'function' ? lengthOfLongestSubstring : (typeof Solution === 'function' ? (new Solution()).lengthOfLongestSubstring : null);
console.log(fn ? fn(input) : 0);
`,
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        Solution sol = new Solution();
        System.out.println(sol.lengthOfLongestSubstring(s));
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "trimmed",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "abcabcbb", expected: "3", weight: 50 },
      { id: 2, title: "Test Case 2", input: "bbbbb", expected: "1", weight: 50 },
    ],
    hiddenTestCases: [
      { id: 101, input: "dvdf", expected: "3", weight: 50 },
    ],
  },
  {
    id: "palindrome-number",
    problemNumber: 9,
    title: "Palindrome Number",
    slug: "palindrome-number",
    difficulty: "Easy",
    topics: ["Math"],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward.`,
    inputFormat: "Line 1: Integer `x`",
    outputFormat: "`true` or `false`",
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    examples: [
      { num: 1, input: "121", output: "true", explanation: "121 reads 121 from both directions." },
      { num: 2, input: "-121", output: "false", explanation: "-121 reads 121- backwards." },
    ],
    starterCode: {
      python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
  // Write your solution here
  return false;
}
`,
      java: `class Solution {
    public boolean isPalindrome(int x) {
        // Write your solution here
        return false;
    }
}
`,
    },
    drivers: {
      python: `import sys

{{USER_CODE}}

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        try:
            solution = Solution()
            result = solution.isPalindrome(int(raw))
        except NameError:
            result = isPalindrome(int(raw))
        print(str(bool(result)).lower())
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').trim();
const fn = typeof isPalindrome === 'function' ? isPalindrome : (typeof Solution === 'function' ? (new Solution()).isPalindrome : null);
if (input) console.log(fn ? fn(Number(input)) : false);
`,
      java: `import java.util.Scanner;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            Solution sol = new Solution();
            System.out.println(sol.isPalindrome(sc.nextInt()));
        }
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "trimmed",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "121", expected: "true", weight: 50 },
      { id: 2, title: "Test Case 2", input: "-121", expected: "false", weight: 50 },
    ],
    hiddenTestCases: [
      { id: 101, input: "12321", expected: "true", weight: 50 },
    ],
  },
  {
    id: "valid-parentheses",
    problemNumber: 20,
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    topics: ["Stack", "Strings"],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    inputFormat: "Line 1: String `s`",
    outputFormat: "`true` or `false`",
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    examples: [
      { num: 1, input: "()", output: "true", explanation: "Simple matching pair." },
      { num: 2, input: "()[]{}", output: "true", explanation: "All open brackets match." },
    ],
    starterCode: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your solution here
  return false;
}
`,
      java: `class Solution {
    public boolean isValid(String s) {
        // Write your solution here
        return false;
    }
}
`,
    },
    drivers: {
      python: `import sys

{{USER_CODE}}

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        try:
            solution = Solution()
            result = solution.isValid(raw)
        except NameError:
            result = isValid(raw)
        print(str(bool(result)).lower())
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').trim();
const fn = typeof isValid === 'function' ? isValid : (typeof Solution === 'function' ? (new Solution()).isValid : null);
if (input) console.log(fn ? fn(input) : false);
`,
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            Solution sol = new Solution();
            System.out.println(sol.isValid(sc.nextLine().trim()));
        }
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "trimmed",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "()", expected: "true", weight: 50 },
      { id: 2, title: "Test Case 2", input: "()[]{}", expected: "true", weight: 50 },
    ],
    hiddenTestCases: [
      { id: 101, input: "([{}])", expected: "true", weight: 50 },
    ],
  },
  {
    id: "maximum-subarray",
    problemNumber: 53,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    topics: ["Arrays", "Divide and Conquer", "Dynamic Programming"],
    description: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.`,
    inputFormat: "Line 1: JSON array or comma-separated integers `nums`",
    outputFormat: "Integer representing maximum sum",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    examples: [
      { num: 1, input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
      { num: 2, input: "[1]", output: "1", explanation: "The subarray [1] has the largest sum 1." },
    ],
    starterCode: {
      python: `class Solution:
    def maxSubArray(self, nums):
        # Write your solution here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Write your solution here
  return 0;
}
`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {
        // Write your solution here
        return 0;
    }
}
`,
    },
    drivers: {
      python: `import sys, json

{{USER_CODE}}

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        nums = json.loads(raw) if raw.startswith('[') else [int(x) for x in raw.replace(',', ' ').split()]
        try:
            solution = Solution()
            result = solution.maxSubArray(nums)
        except NameError:
            result = maxSubArray(nums)
        print(result if result is not None else 0)
`,
      javascript: `const fs = require('fs');

{{USER_CODE}}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
  const nums = JSON.parse(input.startsWith('[') ? input : JSON.stringify(input.split(/[\\s,]+/).map(Number)));
  const fn = typeof maxSubArray === 'function' ? maxSubArray : (typeof Solution === 'function' ? (new Solution()).maxSubArray : null);
  console.log(fn ? fn(nums) : 0);
}
`,
      java: `import java.util.*;

{{USER_CODE}}

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextLine()) return;
        String line = sc.nextLine().replace("[", "").replace("]", "").replace(",", " ").trim();
        String[] parts = line.split("\\\\s+");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i]);
        }
        Solution sol = new Solution();
        System.out.println(sol.maxSubArray(nums));
    }
}
`,
    },
    supportedLanguages: ["python", "javascript", "java"],
    comparisonMode: "trimmed",
    timeLimit: 5000,
    memoryLimit: 128,
    sampleTestCases: [
      { id: 1, title: "Test Case 1", input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6", weight: 50 },
      { id: 2, title: "Test Case 2", input: "[1]", expected: "1", weight: 50 },
    ],
    hiddenTestCases: [
      { id: 101, input: "[-1,-2,-3,-4]", expected: "-1", weight: 50 },
    ],
  },
];

module.exports = {
  PROBLEMS_DATA,
};

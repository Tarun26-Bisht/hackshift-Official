/**
 * Mock database of courses categorized by skill.
 * In a real app, this would fetch from Udemy, Coursera, or YouTube APIs.
 */
const COURSE_DATABASE = {
  python: [
    { id: 1, title: "Python for Data Science (Free)", platform: "YouTube", price: "Free", link: "https://youtube.com/python-ds" },
    { id: 2, title: "Complete Python Bootcamp", platform: "Udemy", price: "$12.99", link: "https://udemy.com/python-bootcamp" }
  ],
  javascript: [
    { id: 3, title: "Modern JS from the Beginning", platform: "Udemy", price: "$11.99", link: "https://udemy.com/modern-js" },
    { id: 4, title: "JavaScript Crash Course (Free)", platform: "YouTube", price: "Free", link: "https://youtube.com/js-crash" }
  ],
  react: [
    { id: 5, title: "React - The Complete Guide", platform: "Udemy", price: "$13.99", link: "https://udemy.com/react-guide" },
    { id: 6, title: "Learn React in 30 Minutes", platform: "YouTube", price: "Free", link: "https://youtube.com/react-30" }
  ],
  default: [
    { id: 0, title: "General Career Preparation", platform: "LinkedIn Learning", price: "Free Trial", link: "https://linkedin.com/learning" }
  ]
};

function getRecommendationsForSkill(skill) {
  const s = skill.toLowerCase();
  return COURSE_DATABASE[s] || COURSE_DATABASE['default'];
}

module.exports = { getRecommendationsForSkill };

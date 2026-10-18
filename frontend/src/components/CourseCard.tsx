interface Course {
  id: number;
  title: string;
  platform: string;
  price: string;
  link: string;
}

export default function CourseCard({ course }: { course: Course }) {
  const isFree = course.price.toLowerCase() === 'free';

  return (
    <a
      href={course.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{course.title}</p>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${isFree ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
          {course.price}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{course.platform}</p>
    </a>
  );
}

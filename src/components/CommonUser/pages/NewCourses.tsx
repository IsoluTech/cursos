import { useState, useEffect } from "react";
import { makeRequest } from "@/hooks/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Users } from "lucide-react";
import {
  CourseOverview,
  UserCourseEnrollmentOverview,
} from "@/types/CourseType.d";
import { toast } from "sonner";
import PacmanLoader from "react-spinners/PacmanLoader";

export default function NewCourses() {
  const [allCourses, setAllCourses] = useState<CourseOverview[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<
    UserCourseEnrollmentOverview[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);

  const fetchEnrolledCourses = async () => {
    try {
      const data: UserCourseEnrollmentOverview[] = await makeRequest({
        url: `user/${userId}/courses`,
        method: "GET",
      });
      setEnrolledCourses(data);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data: CourseOverview[] = await makeRequest({
          url: "preview/courses",
          method: "GET",
        });
        setAllCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    fetchEnrolledCourses();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[90vh] p-7">
        <PacmanLoader color="#0f172a" loading={loading} size={30} />
      </div>
    );
  }
  const categories = [...new Set(allCourses.map((course) => course.category))];

  const filteredCourses = allCourses.filter((course) => {
    const titleMatches = course.course_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const descriptionMatches = course.description
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const categoryMatches =
      selectedCategory === null || course.category === selectedCategory;
    return (titleMatches || descriptionMatches) && categoryMatches;
  });

  const enrolledUser = async (
    courseId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    try {
      await makeRequest({
        url: `courses/enroll`,
        method: "POST",
        data: { course_id: courseId, user_id: userId },
      });
      toast.success("Inscrito exitosamente");
      const fetchEnrolledCourses = async () => {
        try {
          fetchEnrolledCourses();
        } catch (error) {
          console.error("Error fetching enrolled courses:", error);
        }
      };
      fetchEnrolledCourses();
    } catch (error) {
      console.error("Error enrolling user:", error);
      toast.error("Ocurrió un error al inscribirte en el curso");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Cursos Disponibles</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          type="text"
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:w-1/2"
        />
        <Select
          onValueChange={(value) =>
            setSelectedCategory(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="md:w-1/4">
            <SelectValue placeholder="Filtrar por categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.course_id}>
            <CardHeader>
              <CardTitle>{course.course_name}</CardTitle>
              <CardDescription>{course.instructor}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge className="mb-2">{course.category}</Badge>
              <p className="text-sm text-muted-foreground mb-4">
                {course.description}
              </p>
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{course.total_hours} horas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrolled_students} estudiantes</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-lg font-bold">
                ${parseFloat(course.price).toFixed(2)}
              </span>
              {enrolledCourses.some(
                (enrolledCourse) =>
                  enrolledCourse.course_id === course.course_id
              ) ? (
                <Button disabled className="bg-gray-500">
                  Inscrito
                </Button>
              ) : (
                <Button
                  className="bg-violet-600"
                  onClick={(e) => enrolledUser(course.course_id, e)}
                >
                  Inscribirse
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">
          No se encontraron cursos que coincidan con tu búsqueda.
        </p>
      )}
    </div>
  );
}

import { Users, GraduationCap, School, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const StatsCard = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="bg-white overflow-hidden shadow rounded-xl border border-slate-200">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={clsx("p-3 rounded-md", color)}>
                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-text truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-bold text-primary">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
